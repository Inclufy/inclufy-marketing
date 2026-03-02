// src/services/context-marketing/business-context.service.ts
import { supabase } from '@/integrations/supabase/client';
import { 
  OrganizationEntity, 
  StrategicObjective, 
  OperatingModel, 
  GovernanceFramework,
  ContextCompleteness 
} from '@/types/context-marketing';

export class BusinessContextService {
  // Organization Management
  async createOrganization(org: Partial<OrganizationEntity>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('organization_entities')
      .insert({
        ...org,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOrganizationStructure() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('organization_entities')
      .select('*')
      .eq('user_id', user.user.id)
      .order('parent_id', { ascending: true });

    if (error) throw error;
    return this.buildOrgTree(data || []);
  }

  private buildOrgTree(entities: OrganizationEntity[]) {
    const map = new Map();
    const roots: OrganizationEntity[] = [];

    // First pass: create all nodes
    entities.forEach(entity => {
      map.set(entity.id, { ...entity, children: [] });
    });

    // Second pass: build tree
    entities.forEach(entity => {
      if (entity.parent_id) {
        const parent = map.get(entity.parent_id);
        if (parent) {
          parent.children.push(map.get(entity.id));
        }
      } else {
        roots.push(map.get(entity.id));
      }
    });

    return roots;
  }

  // Strategic Objectives
  async createObjective(objective: Partial<StrategicObjective>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('strategic_objectives')
      .insert({
        ...objective,
        user_id: user.user.id,
        status: objective.status || 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    await this.updateContextCompleteness('business');
    return data;
  }

  async getObjectives(status?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('strategic_objectives')
      .select('*')
      .eq('user_id', user.user.id)
      .order('priority', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Operating Model
  async saveOperatingModel(model: Partial<OperatingModel>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('operating_model')
      .select('id')
      .eq('user_id', user.user.id)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('operating_model')
        .update(model)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('operating_model')
        .insert({
          ...model,
          user_id: user.user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    await this.updateContextCompleteness('business');
    return result;
  }

  async getOperatingModel() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('operating_model')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }

  // Governance Framework
  async saveGovernanceFramework(framework: Partial<GovernanceFramework>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('governance_framework')
      .select('id')
      .eq('user_id', user.user.id)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('governance_framework')
        .update(framework)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('governance_framework')
        .insert({
          ...framework,
          user_id: user.user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    await this.updateContextCompleteness('business');
    return result;
  }

  // Context Completeness
  async updateContextCompleteness(domain: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call the database function to calculate completeness
    const { data, error } = await supabase.rpc('calculate_context_completeness', {
      p_user_id: user.user.id,
      p_domain: domain
    });

    if (error) throw error;
    return data;
  }

  async getContextCompleteness() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('context_completeness')
      .select('*')
      .eq('user_id', user.user.id);

    if (error) throw error;
    
    // Calculate overall score
    const scores = data || [];
    const overallScore = scores.length > 0
      ? scores.reduce((sum, item) => sum + Number(item.completeness_score), 0) / scores.length
      : 0;

    return {
      domains: scores,
      overall: overallScore
    };
  }

  // Validation
  async validateBusinessContext() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const issues: any[] = [];
    
    // Check for organization
    const { data: orgs } = await supabase
      .from('organization_entities')
      .select('id')
      .eq('user_id', user.user.id)
      .limit(1);

    if (!orgs || orgs.length === 0) {
      issues.push({
        domain: 'business',
        field: 'organization',
        message: 'No organization structure defined',
        severity: 'error'
      });
    }

    // Check for objectives
    const { data: objectives } = await supabase
      .from('strategic_objectives')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .limit(1);

    if (!objectives || objectives.length === 0) {
      issues.push({
        domain: 'business',
        field: 'objectives',
        message: 'No active strategic objectives',
        severity: 'warning'
      });
    }

    // Check for operating model
    const { data: model } = await supabase
      .from('operating_model')
      .select('id')
      .eq('user_id', user.user.id)
      .limit(1);

    if (!model || model.length === 0) {
      issues.push({
        domain: 'business',
        field: 'operating_model',
        message: 'Operating model not defined',
        severity: 'warning'
      });
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
}

// Export singleton instance
export const businessContextService = new BusinessContextService();