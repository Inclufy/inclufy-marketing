from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import datetime
from supabase import Client
from pydantic import BaseModel, field_validator
import re
import uuid
import logging

from dependencies import get_current_user, get_supabase_client
from services.real_data_analyzer import analyze_company_with_real_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/growth-blueprint", tags=["Growth Blueprint"])


def validate_uuid(value: str) -> str:
    try:
        uuid.UUID(value, version=4)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid blueprint_id format: '{value}'",
        )
    return value


class BlueprintScanInput(BaseModel):
    company_name: str
    website_url: Optional[str] = None
    industry: Optional[str] = None

    @field_validator("company_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("company_name cannot be empty")
        return v.strip()


def safe_int(value, default=None):
    """Convert value to int safely"""
    if value is None:
        return default
    if isinstance(value, bool):
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if re.fullmatch(r'(19|20)\d{2}', stripped):
            return int(stripped)
    return default

@router.get("/stats")
def get_blueprint_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """Get statistics about user's blueprints"""
    try:
        result = db.table("growth_blueprints")\
            .select("*")\
            .eq("user_id", current_user["id"])\
            .execute()
        
        blueprints = result.data or []
        
        return {
            "scans_this_month": len(blueprints),
            "avg_score": sum(bp.get('overall_score', 0) for bp in blueprints) // len(blueprints) if blueprints else 0,
            "setups_completed": sum(1 for bp in blueprints if bp.get('setup_completed')),
            "opportunities": len(blueprints) * 3
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch blueprint stats for user %s: %s", current_user.get("id"), e)
        raise HTTPException(status_code=500, detail="Failed to retrieve blueprint statistics")

@router.get("/")
def list_blueprints(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """List all blueprints for current user"""
    try:
        result = db.table("growth_blueprints")\
            .select("*")\
            .eq("user_id", current_user["id"])\
            .order("created_at", desc=True)\
            .execute()
        
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list blueprints for user %s: %s", current_user.get("id"), e)
        raise HTTPException(status_code=500, detail="Failed to retrieve blueprints")

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_blueprint(
    scan_input: BlueprintScanInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """Create new blueprint and start scan"""
    logger.info("Creating blueprint: %s", scan_input.company_name)
    
    try:
        blueprint_data = {
            "user_id": current_user["id"],
            "company_name": scan_input.company_name,
            "website_url": scan_input.website_url,
            "industry": scan_input.industry,
            "status": "scanning",
            "scan_progress": 25,
            "scan_started_at": datetime.utcnow().isoformat(),
        }
        
        result = db.table("growth_blueprints").insert(blueprint_data).execute()
        blueprint = result.data[0]
        logger.info("Blueprint created: %s", blueprint['id'])
        
        # Start background scan
        import threading
        def complete_scan():
            import time
            import asyncio
            
            time.sleep(2)
            
            try:
                db.table("growth_blueprints").update({
                    "scan_progress": 50,
                    "status": "analyzing"
                }).eq("id", blueprint['id']).execute()
            except Exception as e:
                logger.warning("Progress update failed: %s", e)
            
            time.sleep(2)
            
            if scan_input.website_url:
                logger.info("Starting real data analysis...")
                
                try:
                    website_url = scan_input.website_url
                    if not website_url.startswith(('http://', 'https://')):
                        website_url = f"https://{website_url}"
                    
                    real_analysis = asyncio.run(analyze_company_with_real_data(
                        company_name=scan_input.company_name,
                        website_url=website_url,
                        industry=scan_input.industry
                    ))
                    
                    ai_analysis = real_analysis.get('website_analysis', {}).get('ai_analysis') or {}
                    
                    if not ai_analysis:
                        ai_analysis = {
                            'industry': scan_input.industry or 'Unknown',
                            'value_proposition': 'Analysis unavailable',
                            'strengths': ['Website accessible'],
                            'weaknesses': ['Analysis failed'],
                            'founders': [],
                            'founding_year': None
                        }
                    
                    status_quo_data = {
                        "blueprint_id": blueprint['id'],
                        "company_name": scan_input.company_name,
                        "industry": ai_analysis.get('industry', scan_input.industry or "Unknown"),
                        "website_url": website_url,
                        "website_score": real_analysis['scores']['website'],
                        "seo_score": real_analysis['scores']['seo'],
                        "content_score": real_analysis['scores']['content'],
                        "social_score": real_analysis['scores']['social'],
                        "brand_consistency_score": real_analysis['overall_score'],
                        "media_presence_score": real_analysis['scores']['media'],
                        "strengths": ai_analysis.get('strengths', []),
                        "weaknesses": ai_analysis.get('weaknesses', []),
                        "founding_year": safe_int(ai_analysis.get('founding_year')),
                        "founders": ai_analysis.get('founders', []),
                        "ai_analysis": ai_analysis,
                        "linkedin_data": real_analysis.get('linkedin_data', {}),
                        "google_data": real_analysis.get('google_data', {})
                    }
                    
                    overall_score = real_analysis['overall_score']
                    logger.info("Analysis complete! Score: %s", overall_score)
                    
                except Exception as e:
                    logger.error("Analysis failed: %s", e, exc_info=True)
                    
                    db.table("growth_blueprints").update({
                        "status": "failed",
                        "scan_progress": 0
                    }).eq("id", blueprint['id']).execute()
                    return
            else:
                logger.warning("No website URL provided")
                return
            
            try:
                db.table("blueprint_status_quo").insert(status_quo_data).execute()
                logger.info("Status quo saved")
            except Exception as e:
                logger.error("Status quo save failed: %s", e)
            
            time.sleep(0.5)
            
            try:
                vision_data = {
                    "blueprint_id": blueprint['id'],
                    "stated_mission": ai_analysis.get('value_proposition', ''),
                    "extracted_vision": ai_analysis.get('value_proposition', ''),
                    "ambition_risk_score": 65,
                    "reality_alignment_score": 72
                }
                db.table("blueprint_vision").insert(vision_data).execute()
                logger.info("Vision saved")
            except Exception as e:
                logger.warning("Vision save failed: %s", e)
            
            time.sleep(0.5)
            
            try:
                recommendations = [
                    {
                        "blueprint_id": blueprint['id'],
                        "priority": "critical",
                        "category": "SEO",
                        "title": "SEO Optimization",
                        "description": f"Improve SEO score from {real_analysis['scores']['seo']} to 80+",
                        "impact_score": 10,
                        "effort_score": 5,
                        "estimated_timeline_days": 60
                    }
                ]
                db.table("blueprint_recommendations").insert(recommendations).execute()
                logger.info("Recommendations saved")
            except Exception as e:
                logger.warning("Recommendations save failed: %s", e)
            
            try:
                db.table("growth_blueprints").update({
                    "status": "completed",
                    "scan_progress": 100,
                    "overall_score": overall_score,
                    "scan_completed_at": datetime.utcnow().isoformat()
                }).eq("id", blueprint['id']).execute()
                logger.info("Blueprint completed!")
            except Exception as e:
                logger.error("Completion update failed: %s", e)
        
        threading.Thread(target=complete_scan, daemon=True).start()
        
        return blueprint
        
    except Exception as e:
        logger.error("Blueprint creation failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create blueprint")

@router.get("/{blueprint_id}")
def get_blueprint(
    blueprint_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """Get single blueprint with all related data"""
    validate_uuid(blueprint_id)
    try:
        blueprint = db.table("growth_blueprints")\
            .select("*")\
            .eq("id", blueprint_id)\
            .single()\
            .execute()
        
        status_quo = db.table("blueprint_status_quo")\
            .select("*")\
            .eq("blueprint_id", blueprint_id)\
            .limit(1)\
            .execute()
        
        vision = db.table("blueprint_vision")\
            .select("*")\
            .eq("blueprint_id", blueprint_id)\
            .limit(1)\
            .execute()
        
        recommendations = db.table("blueprint_recommendations")\
            .select("*")\
            .eq("blueprint_id", blueprint_id)\
            .execute()
        
        opportunities = db.table("blueprint_opportunities")\
            .select("*")\
            .eq("blueprint_id", blueprint_id)\
            .execute()
        
        threats = db.table("blueprint_threats")\
            .select("*")\
            .eq("blueprint_id", blueprint_id)\
            .execute()
        
        return {
            "blueprint": blueprint.data,
            "status_quo": status_quo.data[0] if status_quo.data else None,
            "vision": vision.data[0] if vision.data else None,
            "recommendations": recommendations.data,
            "opportunities": opportunities.data,
            "threats": threats.data
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get blueprint %s: %s", blueprint_id, e)
        raise HTTPException(status_code=404, detail="Blueprint not found")

@router.patch("/{blueprint_id}")
def update_blueprint(
    blueprint_id: str,
    setup_completed: bool = False,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """Update blueprint"""
    validate_uuid(blueprint_id)
    try:
        logger.info("Updating blueprint %s: setup_completed=%s", blueprint_id, setup_completed)

        result = db.table("growth_blueprints")\
            .update({"setup_completed": setup_completed})\
            .eq("id", blueprint_id)\
            .eq("user_id", current_user["id"])\
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Blueprint not found")

        logger.info("Blueprint %s updated", blueprint_id)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update blueprint %s: %s", blueprint_id, e)
        raise HTTPException(status_code=500, detail="Failed to update blueprint")
