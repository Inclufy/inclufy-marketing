import { useState, useEffect } from "react";
import { Palette, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Fallback logos for default brands
import logoSolutions from "@/assets/logo-solutions.png";
import logoConsulting from "@/assets/logo-consulting.png";
import logoAcademy from "@/assets/logo-academy.png";

export interface BrandKit {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  font_family: string;
  tagline: string | null;
  is_default: boolean;
}

// Legacy type for backwards compatibility
export type Brand = string;

interface BrandSelectorProps {
  selectedBrand: string | null;
  onBrandChange: (brandId: string, brandKit: BrandKit) => void;
}

export const BrandSelector = ({ selectedBrand, onBrandChange }: BrandSelectorProps) => {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandKits = async () => {
      try {
        const { data, error } = await supabase
          .from('brand_kits')
          .select('*')
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        setBrandKits(data || []);
        
        // Auto-select default brand if none selected
        if (!selectedBrand && data && data.length > 0) {
          const defaultKit = data.find(k => k.is_default) || data[0];
          onBrandChange(defaultKit.id, defaultKit);
        }
      } catch (error) {
        console.error("Error fetching brand kits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandKits();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (brandKits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Palette className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Geen brand kits gevonden.{" "}
          <a href="/brand-kits" className="text-primary hover:underline">
            Maak er een aan
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {brandKits.map((kit) => (
        <button
          key={kit.id}
          onClick={() => onBrandChange(kit.id, kit)}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            selectedBrand === kit.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {kit.logo_url ? (
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={kit.logo_url}
                  alt={kit.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: `linear-gradient(135deg, ${kit.primary_color}, ${kit.secondary_color})`,
                }}
              >
                <Palette className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-semibold text-foreground truncate">{kit.name}</span>
          </div>
          {kit.tagline && (
            <p className="text-xs text-muted-foreground ml-10 truncate">{kit.tagline}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2 ml-10">
            <div 
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: kit.primary_color }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: kit.secondary_color }}
            />
          </div>
        </button>
      ))}
    </div>
  );
};

// Helper functions that work with BrandKit
export const getBrandColors = (kit: BrandKit | null) => {
  if (!kit) return { primary: "#db2777", secondary: "#7c3aed" };
  return { primary: kit.primary_color, secondary: kit.secondary_color };
};

export const getBrandLabel = (kit: BrandKit | null) => {
  return kit?.name || "Inclufy";
};

export const getBrandLogo = (kit: BrandKit | null) => {
  if (kit?.logo_url) return kit.logo_url;
  // Fallback to default logos based on name
  const name = kit?.name?.toLowerCase() || "";
  if (name.includes("consulting")) return logoConsulting;
  if (name.includes("academy")) return logoAcademy;
  return logoSolutions;
};

export const getBrandFont = (kit: BrandKit | null) => {
  return kit?.font_family || "system-ui";
};
