// src/utils/routeMapping.ts

// Map old routes to new routes for backwards compatibility
export const routeRedirects = {
  // Phase 1 redirects
  '/context-marketing/business-context': '/strategy/business-context',
  '/context-marketing/products': '/strategy/products',
  
  // Phase 2 redirects
  '/context-marketing/competitive-intelligence': '/intelligence/competitors',
  
  // Phase 3 redirects
  '/context-marketing/pattern-recognition': '/intelligence/patterns',
  
  // Phase 4 redirects
  '/context-marketing/automation': '/automation/workflows',
  
  // Phase 5 redirects
  '/context-marketing/analytics': '/analytics/performance',
  
  // Phase 6 redirects
  '/context-marketing/ai-assistant': '/ai/assistant',
  
  // Phase 7 redirects
  '/context-marketing/autonomous/mission-control': '/autonomous/mission-control',
  
  // Phase 8 redirects
  '/context-marketing/quantum': '/advanced/quantum',
};