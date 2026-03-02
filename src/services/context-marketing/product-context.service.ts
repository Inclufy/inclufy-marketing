// src/services/context-marketing/product-context.service.ts
import { supabase } from '@/integrations/supabase/client';
import { 
  Product, 
  ProductRelationship, 
  ProductRoadmapItem 
} from '@/types/context-marketing';

export class ProductContextService {
  // Product Catalog Management
  async createProduct(product: Partial<Product>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        user_id: user.user.id,
        status: product.status || 'concept'
      })
      .select()
      .single();

    if (error) throw error;
    await this.updateProductContextCompleteness();
    return data;
  }

  async updateProduct(productId: string, updates: Partial<Product>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProducts(status?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('products')
      .select(`
        *,
        product_relationships!product_id(
          related_product_id,
          relationship_type,
          description
        )
      `)
      .eq('user_id', user.user.id)
      .order('product_name');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getProduct(productId: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_relationships!product_id(
          related_product_id,
          relationship_type,
          description
        ),
        product_roadmap(*)
      `)
      .eq('id', productId)
      .eq('user_id', user.user.id)
      .single();

    if (error) throw error;
    return data;
  }

  // Product Relationships
  async createProductRelationship(relationship: Partial<ProductRelationship>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('product_relationships')
      .insert({
        ...relationship,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProductEcosystem() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all products and relationships
    const { data: products } = await this.getProducts();
    const { data: relationships, error } = await supabase
      .from('product_relationships')
      .select('*')
      .eq('user_id', user.user.id);

    if (error) throw error;

    // Build ecosystem graph
    return this.buildEcosystemGraph(products || [], relationships || []);
  }

  private buildEcosystemGraph(products: Product[], relationships: ProductRelationship[]) {
    const nodes = products.map(p => ({
      id: p.id,
      label: p.product_name,
      status: p.status,
      type: p.product_type
    }));

    const edges = relationships.map(r => ({
      source: r.product_id,
      target: r.related_product_id,
      type: r.relationship_type,
      label: r.description
    }));

    return { nodes, edges };
  }

  // Product Roadmap
  async addRoadmapItem(item: Partial<ProductRoadmapItem>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('product_roadmap')
      .insert({
        ...item,
        user_id: user.user.id,
        status: item.status || 'planned'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRoadmap(productId?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('product_roadmap')
      .select(`
        *,
        products(product_name, product_code)
      `)
      .eq('user_id', user.user.id)
      .order('year', { ascending: true })
      .order('quarter', { ascending: true });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Validation and Constraints
  async validateProductClaim(content: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all products and roadmap items
    const { data: products } = await this.getProducts('live');
    const { data: roadmap } = await this.getRoadmap();

    const issues: any[] = [];

    // Check for roadmap features being claimed as live
    roadmap?.forEach(item => {
      if (!item.public_commitment && content.toLowerCase().includes(item.feature_name.toLowerCase())) {
        issues.push({
          type: 'roadmap_claim',
          feature: item.feature_name,
          message: `"${item.feature_name}" is on the roadmap but not yet available`,
          severity: 'error'
        });
      }
    });

    // Check for deprecated product mentions
    const { data: deprecatedProducts } = await this.getProducts('deprecated');
    deprecatedProducts?.forEach(product => {
      if (content.toLowerCase().includes(product.product_name.toLowerCase())) {
        issues.push({
          type: 'deprecated_product',
          product: product.product_name,
          message: `"${product.product_name}" is deprecated and should not be promoted`,
          severity: 'error'
        });
      }
    });

    // Check constraints
    products?.forEach(product => {
      product.constraints?.forEach((constraint: any) => {
        if (constraint.type === 'availability' && content.includes(product.product_name)) {
          // Check if content violates availability constraints
          if (constraint.regions && !content.includes('available in select regions')) {
            issues.push({
              type: 'constraint_violation',
              product: product.product_name,
              message: `${product.product_name} has regional availability constraints`,
              severity: 'warning'
            });
          }
        }
      });
    });

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }

  // Context Completeness
  async updateProductContextCompleteness() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('calculate_context_completeness', {
      p_user_id: user.user.id,
      p_domain: 'product'
    });

    if (error) throw error;
    return data;
  }

  // Product Intelligence
  async getProductInsights() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const products = await this.getProducts();
    const roadmap = await this.getRoadmap();

    // Calculate insights
    const insights = {
      totalProducts: products?.length || 0,
      liveProducts: products?.filter(p => p.status === 'live').length || 0,
      inDevelopment: products?.filter(p => ['development', 'pilot', 'beta'].includes(p.status)).length || 0,
      roadmapItems: roadmap?.length || 0,
      upcomingQuarter: roadmap?.filter(item => {
        const currentYear = new Date().getFullYear();
        const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
        return item.year === currentYear && parseInt(item.quarter.replace('Q', '')) === currentQuarter + 1;
      }).length || 0,
      productHealth: this.calculateProductHealth(products || [])
    };

    return insights;
  }

  private calculateProductHealth(products: Product[]) {
    if (products.length === 0) return 0;

    let score = 0;
    let factors = 0;

    products.forEach(product => {
      // Has description
      if (product.description && product.description.length > 50) {
        score += 1;
      }
      factors += 1;

      // Has features listed
      if (product.key_features && product.key_features.length > 0) {
        score += 1;
      }
      factors += 1;

      // Has differentiators
      if (product.differentiators && product.differentiators.length > 0) {
        score += 1;
      }
      factors += 1;

      // Has pricing model
      if (product.pricing_model && Object.keys(product.pricing_model).length > 0) {
        score += 1;
      }
      factors += 1;
    });

    return factors > 0 ? (score / factors) * 100 : 0;
  }
}

// Export singleton instance
export const productContextService = new ProductContextService();