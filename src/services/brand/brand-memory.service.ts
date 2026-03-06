import { supabase } from "@/integrations/supabase/client";

export type BrandMemoryRow = {
  id: string;
  user_id: string;

  brand_name: string;
  legal_name: string;
  brand_description: string;
  mission: string;
  vision: string;
  tagline: string;
  elevator_pitch: string;
  positioning_statement: string;

  brand_values: string[];
  brand_pillars: string[];
  archetypes: string[];

  industries: string[];
  audiences: string[];
  regions: string[];
  languages: string[];

  usps: string[];
  differentiators: string[];
  proof_points: string[]; // <- made consistent

  tone_attributes: { attribute: string; description: string }[]; // <- requires jsonb column
  messaging_dos: string;
  messaging_donts: string;
  preferred_vocabulary: string[];
  banned_phrases: string[];
  compliance_rules: string;

  urls: string[];

  examples_good: string;
  examples_poor: string;
  test_prompt: string;

  // Extended fields (bridged from onboarding)
  competitors: { name: string; website: string }[];
  marketing_goals: string[];
  primary_color: string;
  secondary_color: string;

  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

export type BrandMemoryUpsert = Partial<
  Omit<
    BrandMemoryRow,
    "id" | "user_id" | "created_at" | "updated_at" | "is_active" | "version"
  >
>;

class BrandMemoryService {
  async getOrCreateActive(): Promise<BrandMemoryRow> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: existing, error } = await supabase
      .from("brand_memory")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;
    if (existing) return existing as BrandMemoryRow;

    const { data: created, error: insertError } = await supabase
      .from("brand_memory")
      .insert({
        user_id: user.id,
        brand_name: "",
        legal_name: "",
        brand_description: "",
        mission: "",
        vision: "",
        tagline: "",
        elevator_pitch: "",
        positioning_statement: "",
        brand_values: [],
        brand_pillars: [],
        archetypes: [],
        industries: [],
        audiences: [],
        regions: [],
        languages: ["en"],
        usps: [],
        differentiators: [],
        proof_points: [],
        tone_attributes: [],
        messaging_dos: "",
        messaging_donts: "",
        preferred_vocabulary: [],
        banned_phrases: [],
        compliance_rules: "",
        urls: [],
        examples_good: "",
        examples_poor: "",
        test_prompt: "",
        competitors: [],
        marketing_goals: [],
        primary_color: "#7c3aed",
        secondary_color: "#ec4899",
        is_active: true,
        version: 1,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;
    return created as BrandMemoryRow;
  }

  // Note: functionally this is an UPDATE of the active row.
  async upsertActive(patch: BrandMemoryUpsert): Promise<BrandMemoryRow> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const current = await this.getOrCreateActive();

    const { data, error } = await supabase
      .from("brand_memory")
      .update({
        ...patch,
        version: (current.version ?? 1) + 1,
      })
      .eq("id", current.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) throw error;
    return data as BrandMemoryRow;
  }

  async snapshot(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const current = await this.getOrCreateActive();

    const { error } = await supabase.from("brand_memory_versions").insert({
      brand_memory_id: current.id,
      user_id: user.id,
      snapshot: current,
    });

    if (error) throw error;
  }
}

export const brandMemoryService = new BrandMemoryService();
