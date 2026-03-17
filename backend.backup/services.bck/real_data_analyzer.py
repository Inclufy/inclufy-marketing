import os
import re
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncio
import httpx
from bs4 import BeautifulSoup
from openai import OpenAI

class RealDataAnalyzer:
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.news_api_key = os.getenv("NEWS_API_KEY")
        self.http_client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
        )
    
    async def analyze_website(self, url: str) -> Dict[str, Any]:
        print(f"🌐 Analyzing website: {url}")
        try:
            if not url.startswith(('http://', 'https://')):
                url = f"https://{url}"
            
            response = await self.http_client.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = soup.find('title')
            title_text = title.string if title else "No title"
            
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc.get('content', '') if meta_desc else ''
            
            h1_tags = [h1.get_text(strip=True) for h1 in soup.find_all('h1')]
            
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text()
            text = ' '.join(text.split())[:5000]
            
            social_links = self._extract_social_links(soup)
            
            has_meta_desc = bool(meta_desc)
            has_h1 = len(h1_tags) > 0
            has_og_tags = bool(soup.find('meta', property=re.compile('^og:')))
            
            website_analysis = await self._ai_analyze_website_content(
                title=title_text,
                description=description,
                h1_tags=h1_tags,
                text_sample=text[:2000],
                url=url
            )
            
            return {
                "url": url,
                "title": title_text,
                "description": description,
                "h1_tags": h1_tags,
                "social_links": social_links,
                "text_sample": text[:500],
                "seo_basics": {
                    "has_meta_description": has_meta_desc,
                    "has_h1": has_h1,
                    "has_og_tags": has_og_tags,
                    "title_length": len(title_text),
                    "description_length": len(description)
                },
                "ai_analysis": website_analysis,
                "success": True
            }
        except Exception as e:
            print(f"❌ Error analyzing website: {str(e)}")
            return {"url": url, "success": False, "error": str(e), "ai_analysis": None}
    
    def _extract_social_links(self, soup: BeautifulSoup) -> Dict[str, str]:
        social_links = {}
        social_patterns = {
            'linkedin': r'linkedin\.com/company/',
            'twitter': r'twitter\.com/',
            'facebook': r'facebook\.com/',
            'instagram': r'instagram\.com/',
            'youtube': r'youtube\.com/'
        }
        for link in soup.find_all('a', href=True):
            href = link['href']
            for platform, pattern in social_patterns.items():
                if re.search(pattern, href, re.IGNORECASE):
                    social_links[platform] = href
                    break
        return social_links
    
    async def _ai_analyze_website_content(self, title: str, description: str, h1_tags: List[str], text_sample: str, url: str) -> Dict[str, Any]:
        prompt = f"""Analyseer deze Nederlandse bedrijfswebsite:

URL: {url}
Title: {title}
Description: {description}
H1 Tags: {', '.join(h1_tags)}

Content sample: {text_sample}

Geef een analyse in JSON format met:
{{
    "value_proposition": "Kernboodschap in 1-2 zinnen",
    "target_audience": "Wie is de doelgroep?",
    "industry": "In welke industrie?",
    "key_services": ["Service 1", "Service 2"],
    "tone": "Professioneel/Informeel/etc",
    "website_quality_score": 0-100,
    "seo_score": 0-100,
    "content_quality_score": 0-100,
    "strengths": ["Sterkte 1", "Sterkte 2"],
    "weaknesses": ["Zwakte 1", "Zwakte 2"]
}}"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "Je bent een expert in website analyse en SEO voor Nederlandse bedrijven."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"❌ AI analysis error: {str(e)}")
            return None
    
    async def search_news(self, company_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        print(f"📰 Searching news for: {company_name}")
        if not self.news_api_key:
            print("⚠️ No NEWS_API_KEY, using mock data")
            return self._mock_news_data(company_name)
        
        try:
            url = "https://newsapi.org/v2/everything"
            to_date = datetime.now()
            from_date = to_date - timedelta(days=90)
            
            params = {
                "q": company_name,
                "language": "nl",
                "sortBy": "publishedAt",
                "pageSize": limit,
                "apiKey": self.news_api_key,
                "from": from_date.strftime("%Y-%m-%d"),
                "to": to_date.strftime("%Y-%m-%d")
            }
            
            response = await self.http_client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            articles = []
            for article in data.get('articles', [])[:limit]:
                sentiment = await self._analyze_sentiment(f"{article.get('title', '')} {article.get('description', '')}")
                articles.append({
                    "source": article.get('source', {}).get('name', 'Unknown'),
                    "title": article.get('title', ''),
                    "description": article.get('description', ''),
                    "url": article.get('url', ''),
                    "published_at": article.get('publishedAt', ''),
                    "sentiment": sentiment
                })
            return articles
        except Exception as e:
            print(f"❌ Error fetching news: {str(e)}")
            return []
    
    async def _analyze_sentiment(self, text: str) -> str:
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Analyseer sentiment. Antwoord: positive, negative, of neutral"},
                    {"role": "user", "content": text}
                ],
                temperature=0.3,
                max_tokens=10
            )
            sentiment = response.choices[0].message.content.strip().lower()
            if sentiment not in ['positive', 'negative', 'neutral']:
                sentiment = 'neutral'
            return sentiment
        except Exception as e:
            print(f"❌ Sentiment error: {str(e)}")
            return 'neutral'
    
    def _mock_news_data(self, company_name: str) -> List[Dict[str, Any]]:
        return [
            {
                "source": "Emerce",
                "title": f"{company_name} lanceert innovatief AI platform",
                "description": f"Nederlandse startup {company_name} introduceert marketing platform.",
                "url": "https://emerce.nl/...",
                "published_at": (datetime.now() - timedelta(days=15)).isoformat(),
                "sentiment": "positive"
            }
        ]
    
    async def check_social_presence(self, company_name: str, social_links: Dict[str, str]) -> Dict[str, Any]:
        print(f"👥 Checking social presence")
        presence = {
            "has_linkedin": "linkedin" in social_links,
            "has_twitter": "twitter" in social_links,
            "has_facebook": "facebook" in social_links,
            "has_instagram": "instagram" in social_links,
            "total_platforms": len(social_links),
            "links": social_links
        }
        platform_score = len(social_links) * 20
        presence["social_score"] = min(platform_score, 100)
        return presence
    
    async def generate_complete_analysis(self, company_name: str, website_url: str, industry: Optional[str] = None) -> Dict[str, Any]:
        print(f"🔬 Starting analysis for: {company_name}")
        
        website_task = self.analyze_website(website_url)
        news_task = self.search_news(company_name)
        
        website_data, news_data = await asyncio.gather(website_task, news_task, return_exceptions=True)
        
        if isinstance(website_data, Exception):
            website_data = {"success": False, "error": str(website_data)}
        if isinstance(news_data, Exception):
            news_data = []
        
        social_links = website_data.get('social_links', {}) if website_data.get('success') else {}
        social_presence = await self.check_social_presence(company_name, social_links)
        
        website_score = website_data.get('ai_analysis', {}).get('website_quality_score', 50) if website_data.get('success') else 50
        seo_score = website_data.get('ai_analysis', {}).get('seo_score', 50) if website_data.get('success') else 50
        content_score = website_data.get('ai_analysis', {}).get('content_quality_score', 50) if website_data.get('success') else 50
        social_score = social_presence.get('social_score', 0)
        media_score = min(len(news_data) * 10, 100)
        
        overall_score = int((website_score * 0.25) + (seo_score * 0.25) + (content_score * 0.20) + (social_score * 0.20) + (media_score * 0.10))
        
        return {
            "company_name": company_name,
            "website_url": website_url,
            "industry": industry or website_data.get('ai_analysis', {}).get('industry', 'Unknown'),
            "overall_score": overall_score,
            "scores": {"website": website_score, "seo": seo_score, "content": content_score, "social": social_score, "media": media_score},
            "website_analysis": website_data,
            "news_articles": news_data,
            "social_presence": social_presence,
            "analyzed_at": datetime.utcnow().isoformat()
        }
    
    async def close(self):
        await self.http_client.aclose()

async def analyze_company_with_real_data(company_name: str, website_url: str, industry: Optional[str] = None) -> Dict[str, Any]:
    analyzer = RealDataAnalyzer()
    try:
        result = await analyzer.generate_complete_analysis(company_name=company_name, website_url=website_url, industry=industry)
        return result
    finally:
        await analyzer.close()
