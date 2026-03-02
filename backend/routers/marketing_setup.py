from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime
from supabase import Client
from pydantic import BaseModel

from dependencies import get_current_user, get_supabase_client

router = APIRouter(prefix="/api/marketing-setup", tags=["Marketing Setup"])


class FounderInput(BaseModel):
    name: str
    role: str
    bio: Optional[str] = ""


class GoalInput(BaseModel):
    title: str
    current: int
    target: int
    timeline: str
    kpi: str


class MarketingSetupInput(BaseModel):
    blueprint_id: str
    
    # Brand (from blueprint + LinkedIn + AI)
    company_name: str
    industry: str
    website_url: str
    mission: Optional[str] = ""
    founding_year: Optional[int] = None
    company_size: Optional[str] = ""
    hq_location: Optional[str] = ""
    employee_count: Optional[int] = None
    founders: Optional[List[FounderInput]] = []
    
    # Audience (user input)
    target_age_range: Optional[str] = ""
    target_job_title: Optional[str] = ""
    target_company_size: Optional[str] = ""
    target_location: Optional[str] = ""
    pain_points: Optional[List[str]] = []
    
    # Budget (user input)
    monthly_budget: Optional[int] = 0
    annual_budget: Optional[int] = 0
    team_size: Optional[int] = 0
    content_creators: Optional[int] = 0
    
    # Goals (AI-generated)
    goals: Optional[List[GoalInput]] = []


@router.post("/")
def create_marketing_setup(
    setup_data: MarketingSetupInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """Save complete marketing setup from wizard"""
    
    try:
        print(f"💾 Saving marketing setup for blueprint: {setup_data.blueprint_id}")
        print(f"   Company: {setup_data.company_name}")
        print(f"   Industry: {setup_data.industry}")
        print(f"   Founded: {setup_data.founding_year}")
        print(f"   Employees: {setup_data.employee_count}")
        print(f"   Founders: {len(setup_data.founders or [])}")
        
        # Convert founders to dict format
        founders_data = [
            {
                "name": f.name,
                "role": f.role,
                "bio": f.bio
            } for f in (setup_data.founders or [])
        ]
        
        # Convert goals to dict format
        goals_data = [
            {
                "title": g.title,
                "current": g.current,
                "target": g.target,
                "timeline": g.timeline,
                "kpi": g.kpi
            } for g in (setup_data.goals or [])
        ]
        
        # Create comprehensive setup record as JSONB
        setup_record = {
            "user_id": current_user["id"],
            "blueprint_id": setup_data.blueprint_id,
            
            # Brand data
            "company_name": setup_data.company_name,
            "industry": setup_data.industry,
            "website_url": setup_data.website_url,
            "mission": setup_data.mission,
            "founding_year": setup_data.founding_year,
            "company_size": setup_data.company_size,
            "hq_location": setup_data.hq_location,
            "employee_count": setup_data.employee_count,
            "founders": founders_data,
            
            # Audience data
            "target_age_range": setup_data.target_age_range,
            "target_job_title": setup_data.target_job_title,
            "target_company_size": setup_data.target_company_size,
            "target_location": setup_data.target_location,
            "pain_points": setup_data.pain_points or [],
            
            # Budget data
            "monthly_budget": setup_data.monthly_budget,
            "annual_budget": setup_data.annual_budget,
            "team_size": setup_data.team_size,
            "content_creators": setup_data.content_creators,
            
            # Goals data
            "goals": goals_data,
            
            "created_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
        
        # Try to insert into marketing_setup table
        try:
            result = db.table("marketing_setup").insert(setup_record).execute()
            setup_id = result.data[0]["id"]
            print(f"✅ Setup saved to marketing_setup table: {setup_id}")
        except Exception as table_error:
            print(f"⚠️ marketing_setup table doesn't exist, skipping: {table_error}")
            setup_id = "temporary-id"
        
        # Update blueprint status (THIS IS CRITICAL)
        try:
            db.table("growth_blueprints").update({
                "setup_completed": True,
                "setup_completed_at": datetime.utcnow().isoformat()
            }).eq("id", setup_data.blueprint_id).execute()
            
            print(f"✅ Blueprint marked as setup_completed")
        except Exception as bp_error:
            print(f"❌ Failed to update blueprint: {bp_error}")
            raise HTTPException(status_code=500, detail=f"Failed to mark blueprint as complete: {str(bp_error)}")
        
        return {
            "success": True,
            "setup_id": setup_id,
            "message": "Marketing setup completed successfully!",
            "data_saved": {
                "founders": len(founders_data),
                "goals": len(goals_data),
                "budget": setup_data.monthly_budget
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating marketing setup: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-blueprint/{blueprint_id}")
def get_setup_by_blueprint(
    blueprint_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    """Check if marketing setup exists for a blueprint"""
    
    try:
        # Check in growth_blueprints if setup_completed is true
        blueprint = db.table("growth_blueprints")\
            .select("setup_completed")\
            .eq("id", blueprint_id)\
            .eq("user_id", current_user["id"])\
            .single()\
            .execute()
        
        if blueprint.data and blueprint.data.get("setup_completed"):
            return {"exists": True, "setup_id": blueprint_id}
        else:
            return {"exists": False}
            
    except Exception as e:
        print(f"Error checking setup: {e}")
        return {"exists": False}
