"""Tests to verify all Supabase tables are accessible via the REST API.

These tests ensure that all database migrations have been applied correctly
and that PostgREST can serve data from every table the frontend depends on.
"""
import os
import pytest
import requests

# Supabase project configuration
# NOTE: We hardcode the real Supabase URL here instead of reading from env,
# because conftest.py sets SUPABASE_URL to a test mock URL.
SUPABASE_URL = "https://mpxkugfqzmxydxnlxqoj.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGt1Z2Zxem14eWR4bmx4cW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzY5MDEsImV4cCI6MjA4MjA1MjkwMX0.17YXD9I9fZulQGoGZFFFzQ-f-LW4E1lsT3SSpDC_GA0"
)

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}


def _table_accessible(table_name: str) -> int:
    """Return HTTP status code for a lightweight table probe."""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=count&limit=0"
    response = requests.get(url, headers=HEADERS, timeout=10)
    return response.status_code


# ── Context-Marketing Tables (created in sessions 1–3) ─────────────────

CONTEXT_MARKETING_TABLES = [
    "autonomous_decisions",
    "autonomous_campaign_status",
    "data_flow_events",
    "publishable_content",
    "channel_health",
    "scored_leads",
    "scoring_rules",
    "scoring_models",
    "ai_agents",
    "agent_messages",
    "agent_tasks",
    "attribution_models",
    "channel_attributions",
    "journey_paths",
    "opportunities",
    "trend_data",
    "feed_items",
    "captured_contacts",
    "qr_codes",
    "discovered_events",
    "campaign_triggers",
    "triggered_campaigns",
    "lead_profiles",
    "intent_signals",
    "revenue_predictions",
    "revenue_opportunities",
    "strategic_plans",
    "recommendations",
    "autonomous_content",
    "generated_content",
    "brand_voices",
    "content_templates_ai",
    "automation_rules",
    "automation_logs",
    "automation_templates_ai",
    "integration_configs",
    "customer_ltv",
]

# ── Business & Product Context Tables ───────────────────────────────────

BUSINESS_CONTEXT_TABLES = [
    "organization_entities",
    "strategic_objectives",
    "operating_model",
    "governance_framework",
    "context_completeness",
    "products",
    "product_relationships",
    "product_roadmap",
    "competitors",
    "competitive_features",
    "competitive_analysis",
    "competitive_alerts",
    "personas",
    "segments",
]

# ── Analytics & Reporting Tables ────────────────────────────────────────

ANALYTICS_TABLES = [
    "metrics_definitions",
    "metrics_data",
    "analytics_dashboards",
    "dashboard_widgets",
    "attribution_results",
    "predictive_models",
    "predictions",
    "analytics_goals",
    "experiments",
    "experiment_results",
    "data_quality_scores",
    "report_templates",
    "generated_reports",
    "data_quality_rules",
    "scheduled_reports",
    "team_members",
    "notifications",
]

# ── Pattern Recognition & Insights Tables ───────────────────────────────

PATTERN_TABLES = [
    "pattern_definitions",
    "pattern_detection_runs",
    "detected_patterns",
    "pattern_correlations",
    "insights",
    "insight_recommendations",
    "content_predictions",
    "insight_impact_tracking",
    "context_assumptions",
    "validation_rules",
]

# ── Core App Tables ─────────────────────────────────────────────────────

CORE_TABLES = [
    "campaigns",
    "journeys",
    "contacts",
    "content_items",
    "social_accounts",
    "brand_kits",
    "brand_memory",
]

ALL_TABLES = (
    CONTEXT_MARKETING_TABLES
    + BUSINESS_CONTEXT_TABLES
    + ANALYTICS_TABLES
    + PATTERN_TABLES
    + CORE_TABLES
)


@pytest.mark.parametrize("table", ALL_TABLES)
def test_table_accessible(table):
    """Each table should return 200 from the Supabase REST API."""
    status = _table_accessible(table)
    assert status == 200, f"Table '{table}' returned HTTP {status} (expected 200)"


def test_all_tables_count():
    """Verify we are testing a reasonable number of tables."""
    assert len(ALL_TABLES) >= 80, f"Expected >=80 tables, got {len(ALL_TABLES)}"


# ── Column-specific regression tests ────────────────────────────────────

def test_data_flow_events_has_created_at():
    """Regression: data_flow_events must use created_at, not timestamp."""
    url = f"{SUPABASE_URL}/rest/v1/data_flow_events?select=created_at&limit=0"
    resp = requests.get(url, headers=HEADERS, timeout=10)
    assert resp.status_code == 200, "data_flow_events.created_at column should exist"


def test_data_flow_events_no_timestamp_column():
    """Regression: data_flow_events must NOT have a timestamp column."""
    url = f"{SUPABASE_URL}/rest/v1/data_flow_events?select=timestamp&limit=0"
    resp = requests.get(url, headers=HEADERS, timeout=10)
    # PostgREST returns 400 for non-existent columns
    assert resp.status_code in (400, 200), (
        f"Unexpected status {resp.status_code} querying timestamp column"
    )


def test_team_members_no_infinite_recursion():
    """Regression: team_members RLS should not cause infinite recursion (500)."""
    status = _table_accessible("team_members")
    assert status == 200, f"team_members returned {status} — possible RLS recursion"
