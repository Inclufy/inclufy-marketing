-- Create brand_kits table
CREATE TABLE public.brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#db2777',
  secondary_color TEXT NOT NULL DEFAULT '#7c3aed',
  logo_url TEXT,
  font_family TEXT DEFAULT 'system-ui',
  tagline TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for quick default lookup
CREATE INDEX idx_brand_kits_default ON public.brand_kits (is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth)
CREATE POLICY "Allow all operations on brand_kits" 
ON public.brand_kits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert default brand kits
INSERT INTO public.brand_kits (name, primary_color, secondary_color, tagline, is_default) VALUES
  ('Solutions', '#db2777', '#7c3aed', 'Inclufy Solutions', true),
  ('Consulting', '#3b82f6', '#06b6d4', 'Inclufy Consulting', false),
  ('Academy', '#10b981', '#84cc16', 'Inclufy Academy', false);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_brand_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_brand_kits_updated_at
BEFORE UPDATE ON public.brand_kits
FOR EACH ROW
EXECUTE FUNCTION public.update_brand_kits_updated_at();