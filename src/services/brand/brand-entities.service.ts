import { supabase } from "@/integrations/supabase/client";
import { brandMemoryService } from "./brand-memory.service";

export type BrandEntity = {
  id: string;
  user_id: string;
  brand_memory_id: string;
  entity_type: string;
  name: string;
  description: string;
  tags: string[];
  data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

class BrandEntitiesService {
  async list(entity_type?: string): Promise<BrandEntity[]> {
    const bm = await brandMemoryService.getOrCreateActive();
    let q = supabase
      .from("brand_entities")
      .select("*")
      .eq("brand_memory_id", bm.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (entity_type) q = q.eq("entity_type", entity_type);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as BrandEntity[];
  }

  async create(input: {
    entity_type: string;
    name: string;
    description?: string;
    tags?: string[];
    data?: Record<string, any>;
  }): Promise<BrandEntity> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) throw new Error("Not authenticated");
    const bm = await brandMemoryService.getOrCreateActive();

    const { data, error } = await supabase
      .from("brand_entities")
      .insert({
        user_id: auth.user.id,
        brand_memory_id: bm.id,
        entity_type: input.entity_type,
        name: input.name,
        description: input.description ?? "",
        tags: input.tags ?? [],
        data: input.data ?? {},
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as BrandEntity;
  }

  async update(id: string, patch: Partial<Omit<BrandEntity, "id" | "user_id" | "brand_memory_id" | "created_at" | "updated_at">>) {
    const { data, error } = await supabase
      .from("brand_entities")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data as BrandEntity;
  }

  async softDelete(id: string) {
    await this.update(id, { is_active: false });
  }
}

export const brandEntitiesService = new BrandEntitiesService();
