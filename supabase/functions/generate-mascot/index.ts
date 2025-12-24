import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MascotRequest {
  gender: string;
  skinTone: string;
  outfit: string;
  pose: string;
  accessory: string;
  hairStyle: string;
  expression: string;
  background: string;
  generateLayers?: boolean;
}

const skinToneMap: Record<string, string> = {
  light: "light skin caucasian",
  medium: "medium tan skin Hispanic Latino",
  dark: "dark brown skin African American",
  asian: "East Asian skin tone",
};

const outfitMap: Record<string, string> = {
  casual: "wearing business casual magenta/pink sweater over collared shirt",
  formal: "wearing formal navy business suit with magenta/pink tie",
  blazer: "wearing smart casual navy blazer over magenta/pink polo shirt",
  vest: "wearing dark vest over white shirt with magenta/pink tie",
};

const poseMap: Record<string, string> = {
  confident: "confident pose with arms crossed",
  thumbsup: "enthusiastic thumbs up gesture",
  waving: "friendly waving hand gesture",
  pointing: "pointing presenting gesture",
  thinking: "thoughtful thinking pose with hand on chin",
};

const accessoryMap: Record<string, string> = {
  none: "",
  glasses: "wearing stylish glasses",
  tablet: "holding a tablet device",
  clipboard: "holding a clipboard",
  headset: "wearing a modern headset",
};

const hairStyleMap: Record<string, string> = {
  short: "short neat professional hair",
  medium: "medium length styled hair",
  long: "long flowing hair",
  curly: "curly voluminous hair",
  bald: "bald head",
  ponytail: "hair in a neat ponytail",
};

const expressionMap: Record<string, string> = {
  happy: "happy smiling expression with bright eyes",
  confident: "confident determined expression",
  friendly: "warm friendly welcoming expression",
  focused: "focused concentrated expression",
  excited: "excited enthusiastic expression with wide smile",
  calm: "calm serene peaceful expression",
};

const backgroundMap: Record<string, string> = {
  white: "clean white background",
  gradient: "soft magenta to pink gradient background",
  blue: "light blue professional background",
  green: "soft mint green background",
  office: "blurred modern office background",
  abstract: "abstract geometric shapes background in magenta and pink",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gender, skinTone, outfit, pose, accessory, hairStyle, expression, background, generateLayers }: MascotRequest = await req.json();
    
    console.log("Generating mascot with options:", { gender, skinTone, outfit, pose, accessory, hairStyle, expression, background, generateLayers });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt based on selections
    const genderDesc = gender === "male" ? "male" : "female";
    const skinDesc = skinToneMap[skinTone] || "light skin";
    const outfitDesc = outfitMap[outfit] || "wearing business casual outfit";
    const poseDesc = poseMap[pose] || "confident standing pose";
    const accessoryDesc = accessoryMap[accessory] || "";
    const hairDesc = hairStyleMap[hairStyle] || "short neat professional hair";
    const expressionDesc = expressionMap[expression] || "happy smiling expression";
    const backgroundDesc = background === "transparent" ? "transparent background, PNG style" : (backgroundMap[background] || "clean white background");

    // If generating layers, we generate separate parts
    if (generateLayers) {
      const layerPrompts = [
        { name: "head", prompt: `Isolated 3D cartoon ${genderDesc} head only, ${skinDesc}, ${hairDesc}, ${expressionDesc}, transparent background, Pixar style, no body, ultra high resolution` },
        { name: "body", prompt: `Isolated 3D cartoon ${genderDesc} torso and body only, ${outfitDesc}, no head no legs, transparent background, Pixar style, ultra high resolution` },
        { name: "arms", prompt: `Isolated 3D cartoon ${genderDesc} arms only, ${poseDesc}, ${outfitDesc} sleeves, transparent background, Pixar style, ultra high resolution` },
      ];

      if (accessory !== "none") {
        layerPrompts.push({ 
          name: "accessory", 
          prompt: `Isolated 3D ${accessoryDesc.replace("wearing", "").replace("holding", "")}, transparent background, Pixar style, ultra high resolution` 
        });
      }

      const layers = [];
      
      for (const layer of layerPrompts) {
        console.log(`Generating layer: ${layer.name}`);
        
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [{ role: "user", content: layer.prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (imageUrl) {
            layers.push({ name: layer.name, image: imageUrl });
          }
        }
      }

      return new Response(
        JSON.stringify({ layers }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard full mascot generation
    const prompt = `Cute 3D cartoon ${genderDesc} mascot character, friendly AI project manager, ${skinDesc}, ${hairDesc}, ${expressionDesc}, ${outfitDesc}, ${poseDesc}, ${accessoryDesc}, magenta and pink brand color accents, ${backgroundDesc}, Pixar Dreamworks style 3D render, professional yet approachable corporate mascot, 1:1 aspect ratio, ultra high resolution`;

    console.log("Generated prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate mascot image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ image: imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating mascot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
