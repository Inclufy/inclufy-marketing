import { supabase } from "@/integrations/supabase/client";
import { brandMemoryService } from "./brand-memory.service";

export type BrandDocumentRow = {
  id: string;
  user_id: string;
  brand_memory_id: string;
  source_type: "file" | "url" | "text";
  title: string;
  source_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  checksum: string | null;
  status: "pending" | "processing" | "ready" | "error";
  error_message: string | null;
  tags: string[];
  metadata: any;
  created_at: string;
  updated_at: string;
};

class BrandDocumentsService {
  async list(): Promise<BrandDocumentRow[]> {
    const bm = await brandMemoryService.getOrCreateActive();
    const { data, error } = await supabase
      .from("brand_documents")
      .select("*")
      .eq("brand_memory_id", bm.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as BrandDocumentRow[];
  }

  async addUrl(title: string, url: string, tags: string[] = []) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) throw new Error("Not authenticated");
    const bm = await brandMemoryService.getOrCreateActive();

    const { data, error } = await supabase
      .from("brand_documents")
      .insert({
        user_id: auth.user.id,
        brand_memory_id: bm.id,
        source_type: "url",
        title,
        source_url: url,
        status: "pending",
        tags,
        metadata: {},
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as BrandDocumentRow;
  }

  async uploadFile(file: File, tags: string[] = []) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) throw new Error("Not authenticated");
    const bm = await brandMemoryService.getOrCreateActive();

    const storagePath = `${auth.user.id}/${crypto.randomUUID()}-${file.name}`;

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from("brand-docs")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    // Register in DB
    const { data, error } = await supabase
      .from("brand_documents")
      .insert({
        user_id: auth.user.id,
        brand_memory_id: bm.id,
        source_type: "file",
        title: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        status: "pending",
        tags,
        metadata: { size: file.size },
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as BrandDocumentRow;
  }

  async deleteDoc(id: string, storage_path?: string | null) {
    if (storage_path) {
      await supabase.storage.from("brand-docs").remove([storage_path]);
    }
    const { error } = await supabase.from("brand_documents").delete().eq("id", id);
    if (error) throw error;
  }
}

export const brandDocumentsService = new BrandDocumentsService();
