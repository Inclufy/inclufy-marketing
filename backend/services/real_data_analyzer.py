# backend/services/real_data_analyzer.py
"""
Enhanced Real Data Analysis Service with RapidAPI LinkedIn
- RapidAPI LinkedIn Data (company info, employees, founders)
- NewsAPI + NewsData.io (news coverage)
- SerpAPI (Google search)
- Website scraping + OpenAI analysis
"""

import os
import re
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncio

import httpx
from bs4 import BeautifulSoup
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class EnhancedDataAnalyzer:
    """Ultimate company analyzer with ALL data sources"""
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.news_api_key = os.getenv("NEWS_API_KEY")
        self.newsdata_api_key = os.getenv("NEWSDATA_API_KEY")
        self.serpapi_key = os.getenv("SERPAPI_KEY")
        self.rapidapi_key = os.getenv("RAPIDAPI_KEY")
        
        self.http_client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            verify=False,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        )
    
    # ==========================================
    # LINKEDIN DATA (RapidAPI)
    # ==========================================
    
    async def get_linkedin_company_data(self, domain: str) -> Dict[str, Any]:
        """Get company data from LinkedIn via RapidAPI"""
        print(f"🔗 Fetching LinkedIn data for domain: {domain}")
        
        if not self.rapidapi_key:
            print("⚠️ No RAPIDAPI_KEY found")
            return {}
        
        try:
            # Clean domain
            domain = domain.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
            
            url = "https://linkedin-data-api.p.rapidapi.com/get-company-by-domain"
            headers = {
                "x-rapidapi-host": "linkedin-data-api.p.rapidapi.com",
                "x-rapidapi-key": self.rapidapi_key
            }
            params = {"domain": domain}
            
            response = await self.http_client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Parse employee count from staffCount string
            staff_count = data.get('staffCount', '')
            employee_count = self._parse_employee_count(staff_count)
            
            # Parse founding year
            founded_year = None
            if data.get('foundedOn'):
                founded_data = data.get('foundedOn', {})
                founded_year = founded_data.get('year')
            
            company_data = {
                "name": data.get('name'),
                "description": data.get('description'),
                "website": data.get('website'),
                "industry": data.get('industry'),
                "company_size": staff_count,
                "employee_count": employee_count,
                "headquarters": data.get('headquarters'),
                "founded_year": founded_year,
                "specialties": data.get('specialities', []),
                "follower_count": data.get('followersCount'),
                "linkedin_url": data.get('url'),
                "logo_url": data.get('logo')
            }
            
            print(f"✅ LinkedIn data retrieved!")
            print(f"   Name: {company_data['name']}")
            print(f"   Employees: {employee_count}")
            print(f"   Founded: {founded_year}")
            
            return company_data
            
        except Exception as e:
            print(f"❌ LinkedIn API error: {str(e)}")
            return {}
    
    def _parse_employee_count(self, staff_count: str) -> int:
        """Parse employee count from LinkedIn staffCount string"""
        if not staff_count:
            return 0
        
        # "11-50 employees" → 30 (midpoint)
        match = re.search(r'(\d+)-(\d+)', staff_count)
        if match:
            low, high = int(match.group(1)), int(match.group(2))
            return (low + high) // 2
        
        # "10,001+ employees" → 10001
        match = re.search(r'([\d,]+)\+', staff_count)
        if match:
            return int(match.group(1).replace(',', ''))
        
        # Try to extract any number
        match = re.search(r'(\d+)', staff_count)
        if match:
            return int(match.group(1))
        
        return 0
    
    # ==========================================
    # GOOGLE SEARCH (SerpAPI)
    # ==========================================
    
    async def search_google(self, query: str) -> Dict[str, Any]:
        """Search Google via SerpAPI"""
        print(f"🔍 Searching Google for: {query}")
        
        if not self.serpapi_key:
            return {"results": []}
        
        try:
            url = "https://serpapi.com/search"
            params = {
                "q": query,
                "api_key": self.serpapi_key,
                "engine": "google",
                "num": 10
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                "organic_results": data.get("organic_results", []),
                "knowledge_graph": data.get("knowledge_graph", {}),
                "answer_box": data.get("answer_box", {})
            }
            
        except Exception as e:
            print(f"❌ Google search error: {str(e)}")
            return {"results": []}
    
    async def extract_company_info_from_google(self, company_name: str) -> Dict[str, Any]:
        """Extract company info from Google Knowledge Graph"""
        print(f"📊 Extracting company info from Google: {company_name}")
        
        search_results = await self.search_google(f"{company_name} company founders")
        knowledge_graph = search_results.get("knowledge_graph", {})
        
        # Parse founding year
        founded_str = knowledge_graph.get("founded", "")
        founding_year = None
        if founded_str:
            match = re.search(r'\b(19|20)\d{2}\b', str(founded_str))
            if match:
                founding_year = int(match.group(0))
        
        # Extract founders
        founders_raw = knowledge_graph.get("founders", [])
        founders = []
        if founders_raw:
            if isinstance(founders_raw, list):
                founders = [{"name": f, "role": "Founder", "bio": ""} for f in founders_raw]
            else:
                founders = [{"name": str(founders_raw), "role": "Founder", "bio": ""}]
        
        company_info = {
            "description": knowledge_graph.get("description", ""),
            "type": knowledge_graph.get("type", ""),
            "founded": founded_str,
            "founding_year": founding_year,
            "founders": founders,
            "headquarters": knowledge_graph.get("headquarters", ""),
            "ceo": knowledge_graph.get("ceo", "")
        }
        
        print(f"✅ Extracted company info from Google")
        return company_info
    
    # ==========================================
    # NEWS SEARCH (Multi-source)
    # ==========================================
    
    async def search_news_multi_source(self, company_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search news from NewsAPI + NewsData"""
        print(f"📰 Searching news from multiple sources...")
        
        newsapi_task = self._search_newsapi(company_name, limit)
        newsdata_task = self._search_newsdata(company_name, limit)
        
        newsapi_results, newsdata_results = await asyncio.gather(
            newsapi_task, newsdata_task, return_exceptions=True
        )
        
        all_articles = []
        if not isinstance(newsapi_results, Exception):
            all_articles.extend(newsapi_results)
        if not isinstance(newsdata_results, Exception):
            all_articles.extend(newsdata_results)
        
        # Deduplicate
        seen_titles = set()
        unique_articles = []
        for article in all_articles:
            title = article.get("title", "").lower()
            if title and title not in seen_titles:
                seen_titles.add(title)
                unique_articles.append(article)
        
        print(f"✅ Found {len(unique_articles)} unique articles")
        return unique_articles[:limit]
    
    async def _search_newsapi(self, company_name: str, limit: int) -> List[Dict]:
        if not self.news_api_key:
            return []
        try:
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": company_name,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": limit,
                "apiKey": self.news_api_key,
                "from": (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
            }
            
            response = await self.http_client.get(url, params=params)
            data = response.json()
            
            return [{
                "source": f"NewsAPI - {a.get('source', {}).get('name')}",
                "title": a.get('title'),
                "url": a.get('url'),
                "published_at": a.get('publishedAt')
            } for a in data.get('articles', [])[:limit]]
        except:
            return []
    
    async def _search_newsdata(self, company_name: str, limit: int) -> List[Dict]:
        if not self.newsdata_api_key:
            return []
        try:
            url = "https://newsdata.io/api/1/news"
            params = {
                "q": company_name,
                "language": "en",
                "apikey": self.newsdata_api_key
            }
            
            response = await self.http_client.get(url, params=params)
            data = response.json()
            
            return [{
                "source": f"NewsData - {a.get('source_id')}",
                "title": a.get('title'),
                "url": a.get('link'),
                "published_at": a.get('pubDate')
            } for a in data.get('results', [])[:limit]]
        except:
            return []
    
    # ==========================================
    # WEBSITE ANALYSIS
    # ==========================================
    
    async def analyze_website(self, url: str) -> Dict[str, Any]:
        """Scrape and analyze website"""
        print(f"🌐 Analyzing website: {url}")
        
        try:
            if not url.startswith(('http://', 'https://')):
                url = f"https://{url}"
            
            response = await self.http_client.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = soup.find('title')
            title_text = title.string if title else ""
            
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc.get('content', '') if meta_desc else ''
            
            for script in soup(["script", "style"]):
                script.decompose()
            text = ' '.join(soup.get_text().split())[:5000]
            
            social_links = self._extract_social_links(soup)
            
            ai_analysis = await self._ai_analyze_website_content(
                title=title_text,
                description=description,
                text_sample=text[:2000],
                url=url
            )
            
            return {
                "url": url,
                "title": title_text,
                "description": description,
                "social_links": social_links,
                "ai_analysis": ai_analysis,
                "success": True
            }
            
        except Exception as e:
            print(f"❌ Website error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _extract_social_links(self, soup: BeautifulSoup) -> Dict[str, str]:
        social_links = {}
        patterns = {
            'linkedin': r'linkedin\.com/company/',
            'twitter': r'twitter\.com/',
            'facebook': r'facebook\.com/'
        }
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            for platform, pattern in patterns.items():
                if re.search(pattern, href, re.IGNORECASE):
                    social_links[platform] = href
                    break
        
        return social_links
    
    async def _ai_analyze_website_content(self, title: str, description: str, text_sample: str, url: str) -> Dict:
        if len(text_sample) < 100:
            return {
                "value_proposition": "Insufficient content",
                "industry": "Unknown",
                "website_quality_score": 30,
                "seo_score": 30,
                "content_quality_score": 20,
                "strengths": ["Website accessible"],
                "weaknesses": ["Minimal content"],
                "founders": [],
                "founding_year": None
            }
        
        prompt = f"""Analyze this website and return JSON:
URL: {url}
Title: {title}
Content: {text_sample}

Return:
{{
    "value_proposition": "1-2 sentence summary",
    "target_audience": "Who they target",
    "industry": "SaaS/E-commerce/AI/Consulting/etc",
    "key_services": ["service1", "service2"],
    "website_quality_score": 0-100,
    "seo_score": 0-100,
    "content_quality_score": 0-100,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "founders": [
        {{
            "name": "Full name if found",
            "role": "Role if found",
            "bio": "Bio if found"
        }}
    ],
    "founding_year": 2023
}}
Be realistic with scores (50-80 is normal)."""
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a website analysis expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
        except:
            return {
                "value_proposition": "Analysis failed",
                "industry": "Unknown",
                "website_quality_score": 50,
                "seo_score": 50,
                "content_quality_score": 50,
                "strengths": ["Website accessible"],
                "weaknesses": ["AI analysis failed"],
                "founders": [],
                "founding_year": None
            }
    
    async def check_social_presence(self, social_links: Dict[str, str]) -> Dict[str, Any]:
        return {
            "total_platforms": len(social_links),
            "links": social_links,
            "social_score": min(len(social_links) * 20, 100)
        }
    
    # ==========================================
    # COMPLETE ANALYSIS (ALL SOURCES)
    # ==========================================
    
    async def generate_complete_analysis(
        self,
        company_name: str,
        website_url: str,
        industry: Optional[str] = None
    ) -> Dict[str, Any]:
        """ULTIMATE analysis using ALL data sources"""
        print(f"🚀 Starting ULTIMATE analysis for: {company_name}")
        print(f"📡 Sources: LinkedIn (RapidAPI) + Google + NewsAPI + NewsData + Website + OpenAI")
        
        if not website_url.startswith(('http://', 'https://')):
            website_url = f"https://{website_url}"
        
        # Extract domain for LinkedIn
        domain = website_url.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
        
        # PARALLEL EXECUTION
        print(f"⚡ Running parallel data collection...")
        
        website_task = self.analyze_website(website_url)
        news_task = self.search_news_multi_source(company_name)
        google_task = self.extract_company_info_from_google(company_name)
        linkedin_task = self.get_linkedin_company_data(domain)
        
        website_data, news_data, google_data, linkedin_data = await asyncio.gather(
            website_task, news_task, google_task, linkedin_task,
            return_exceptions=True
        )
        
        # Handle exceptions
        if isinstance(website_data, Exception):
            website_data = {"success": False}
        if isinstance(news_data, Exception):
            news_data = []
        if isinstance(google_data, Exception):
            google_data = {}
        if isinstance(linkedin_data, Exception):
            linkedin_data = {}
        
        # Merge data
        ai_analysis = website_data.get('ai_analysis', {}) if website_data.get('success') else {}
        
        # Enhance with LinkedIn + Google data (LinkedIn takes priority)
        if linkedin_data:
            ai_analysis['founding_year'] = linkedin_data.get('founded_year') or ai_analysis.get('founding_year')
            ai_analysis['industry'] = linkedin_data.get('industry') or ai_analysis.get('industry')
            ai_analysis['employee_count'] = linkedin_data.get('employee_count')
            ai_analysis['company_size'] = linkedin_data.get('company_size')
            ai_analysis['hq_location'] = linkedin_data.get('headquarters')
        
        if google_data:
            if not ai_analysis.get('founding_year'):
                ai_analysis['founding_year'] = google_data.get('founding_year')
            if not ai_analysis.get('industry'):
                ai_analysis['industry'] = google_data.get('type')
            
            # Merge founders from both sources
            google_founders = google_data.get('founders', [])
            ai_founders = ai_analysis.get('founders', [])
            all_founders = google_founders + ai_founders
            
            # Deduplicate by name
            seen_names = set()
            unique_founders = []
            for founder in all_founders:
                name = founder.get('name', '').lower()
                if name and name not in seen_names:
                    seen_names.add(name)
                    unique_founders.append(founder)
            
            if unique_founders:
                ai_analysis['founders'] = unique_founders
        
        # Social presence
        social_links = website_data.get('social_links', {}) if website_data.get('success') else {}
        social_presence = await self.check_social_presence(social_links)
        
        # Calculate scores
        website_score = ai_analysis.get('website_quality_score', 50)
        seo_score = ai_analysis.get('seo_score', 50)
        content_score = ai_analysis.get('content_quality_score', 50)
        social_score = social_presence.get('social_score', 0)
        media_score = min(len(news_data) * 10, 100)
        
        overall_score = int(
            (website_score * 0.25) +
            (seo_score * 0.25) +
            (content_score * 0.20) +
            (social_score * 0.20) +
            (media_score * 0.10)
        )
        
        print(f"✅ ULTIMATE Analysis Complete!")
        print(f"   📊 Overall: {overall_score}")
        print(f"   📰 News: {len(news_data)} articles")
        print(f"   👥 Founders: {len(ai_analysis.get('founders', []))}")
        print(f"   🏢 Employees: {ai_analysis.get('employee_count', 'Unknown')}")
        print(f"   🔗 LinkedIn: {'✓' if linkedin_data else '✗'}")
        
        return {
            "company_name": company_name,
            "website_url": website_url,
            "industry": industry or ai_analysis.get('industry', 'Unknown'),
            "overall_score": overall_score,
            "scores": {
                "website": website_score,
                "seo": seo_score,
                "content": content_score,
                "social": social_score,
                "media": media_score
            },
            "website_analysis": website_data,
            "news_articles": news_data,
            "social_presence": social_presence,
            "linkedin_data": linkedin_data,
            "google_data": google_data,
            "analyzed_at": datetime.utcnow().isoformat()
        }
    
    async def close(self):
        await self.http_client.aclose()


# Convenience function
async def analyze_company_with_real_data(
    company_name: str,
    website_url: str,
    industry: Optional[str] = None
) -> Dict[str, Any]:
    """Ultimate analysis with ALL sources including LinkedIn"""
    analyzer = EnhancedDataAnalyzer()
    try:
        return await analyzer.generate_complete_analysis(
            company_name=company_name,
            website_url=website_url,
            industry=industry
        )
    finally:
        await analyzer.close()
