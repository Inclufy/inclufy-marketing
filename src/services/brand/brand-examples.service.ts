import { supabase } from "@/integrations/supabase/client";
import { brandMemoryService } from "./brand-memory.service";

export type BrandExample = {
  id: string;
  user_id: string;
  brand_memory_id: string;
  example_type: "good" | "bad";
  channel: string;
  title: string;
  content: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

class BrandExamplesService {
  async list(): Promise<BrandExample[]> {
    const bm = await brandMemoryService.getOrCreateActive();
    const { data, error } = await supabase
      .from("brand_messaging_examples")
      .select("*")
      .eq("brand_memory_id", bm.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as BrandExample[];
  }

  async create(input: Omit<BrandExample, "id" | "user_id" | "brand_memory_id" | "created_at" | "updated_at">) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) throw new Error("Not authenticated");
    const bm = await brandMemoryService.getOrCreateActive();

    const { data, error } = await supabase
      .from("brand_messaging_examples")
      .insert({
        user_id: auth.user.id,
        brand_memory_id: bm.id,
        ...input,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as BrandExample;
  }

  async update(id: string, patch: Partial<BrandExample>) {
    const { data, error } = await supabase
      .from("brand_messaging_examples")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as BrandExample;
  }

  async delete(id: string) {
    const { error } = await supabase.from("brand_messaging_examples").delete().eq("id", id);
    if (error) throw error;
  }
}

export const brandExamplesService = new BrandExamplesService();
