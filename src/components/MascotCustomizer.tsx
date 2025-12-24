import { useState } from "react";
import { Wand2, Download, RotateCcw, FileJson, Layers, ChevronDown, FileImage, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MascotSpeaker } from "./MascotSpeaker";

type Gender = "male" | "female";
type SkinTone = "light" | "medium" | "dark" | "asian";
type Outfit = "casual" | "formal" | "blazer" | "vest";
type Pose = "confident" | "thumbsup" | "waving" | "pointing" | "thinking";
type Accessory = "none" | "glasses" | "tablet" | "clipboard" | "headset";
type HairStyle = "short" | "medium" | "long" | "curly" | "bald" | "ponytail";
type Expression = "happy" | "confident" | "friendly" | "focused" | "excited" | "calm";
type Background = "white" | "gradient" | "blue" | "green" | "office" | "abstract";

const genderOptions = [
  { id: "male" as const, label: "Man", icon: "👔" },
  { id: "female" as const, label: "Vrouw", icon: "👩‍💼" },
];

const skinToneOptions = [
  { id: "light" as const, label: "Licht", color: "#FDEBD0" },
  { id: "medium" as const, label: "Medium", color: "#D4A574" },
  { id: "dark" as const, label: "Donker", color: "#6B4423" },
  { id: "asian" as const, label: "Aziatisch", color: "#F5DEB3" },
];

const outfitOptions = [
  { id: "casual" as const, label: "Casual", icon: "👕" },
  { id: "formal" as const, label: "Formeel", icon: "🎩" },
  { id: "blazer" as const, label: "Blazer", icon: "🧥" },
  { id: "vest" as const, label: "Vest", icon: "🦺" },
];

const poseOptions = [
  { id: "confident" as const, label: "Zelfverzekerd", icon: "💪" },
  { id: "thumbsup" as const, label: "Duim omhoog", icon: "👍" },
  { id: "waving" as const, label: "Zwaaien", icon: "👋" },
  { id: "pointing" as const, label: "Wijzen", icon: "👉" },
  { id: "thinking" as const, label: "Denken", icon: "🤔" },
];

const accessoryOptions = [
  { id: "none" as const, label: "Geen", icon: "✨" },
  { id: "glasses" as const, label: "Bril", icon: "👓" },
  { id: "tablet" as const, label: "Tablet", icon: "📱" },
  { id: "clipboard" as const, label: "Klembord", icon: "📋" },
  { id: "headset" as const, label: "Headset", icon: "🎧" },
];

const hairStyleOptions = [
  { id: "short" as const, label: "Kort", icon: "✂️" },
  { id: "medium" as const, label: "Medium", icon: "💇" },
  { id: "long" as const, label: "Lang", icon: "💁" },
  { id: "curly" as const, label: "Krullend", icon: "🌀" },
  { id: "bald" as const, label: "Kaal", icon: "🥚" },
  { id: "ponytail" as const, label: "Staart", icon: "🎀" },
];

const expressionOptions = [
  { id: "happy" as const, label: "Blij", icon: "😊" },
  { id: "confident" as const, label: "Zeker", icon: "😎" },
  { id: "friendly" as const, label: "Vriendelijk", icon: "🤗" },
  { id: "focused" as const, label: "Gefocust", icon: "🧐" },
  { id: "excited" as const, label: "Enthousiast", icon: "🤩" },
  { id: "calm" as const, label: "Kalm", icon: "😌" },
];

const backgroundOptions = [
  { id: "white" as const, label: "Wit", color: "#FFFFFF" },
  { id: "gradient" as const, label: "Gradient", color: "linear-gradient(135deg, #E91E63, #FF4081)" },
  { id: "blue" as const, label: "Blauw", color: "#E3F2FD" },
  { id: "green" as const, label: "Groen", color: "#E8F5E9" },
  { id: "office" as const, label: "Kantoor", color: "#F5F5F5" },
  { id: "abstract" as const, label: "Abstract", color: "linear-gradient(45deg, #E91E63, #9C27B0)" },
];

export const MascotCustomizer = () => {
  const [gender, setGender] = useState<Gender>("male");
  const [skinTone, setSkinTone] = useState<SkinTone>("light");
  const [outfit, setOutfit] = useState<Outfit>("casual");
  const [pose, setPose] = useState<Pose>("confident");
  const [accessory, setAccessory] = useState<Accessory>("none");
  const [hairStyle, setHairStyle] = useState<HairStyle>("short");
  const [expression, setExpression] = useState<Expression>("happy");
  const [background, setBackground] = useState<Background>("white");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-mascot", {
        body: { gender, skinTone, outfit, pose, accessory, hairStyle, expression, background },
      });

      if (error) {
        console.error("Error:", error);
        toast.error(error.message || "Er ging iets mis bij het genereren");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.image) {
        setGeneratedImage(data.image);
        toast.success("Mascotte succesvol gegenereerd!");
      }
    } catch (err) {
      console.error("Error generating mascot:", err);
      toast.error("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `projextpal-mascot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("PNG gedownload!");
  };

  const handleDownloadJSON = () => {
    const config = {
      version: "1.0",
      type: "mascot-config",
      created: new Date().toISOString(),
      settings: {
        gender,
        skinTone,
        outfit,
        pose,
        accessory,
        hairStyle,
        expression,
        background,
      },
      labels: {
        gender: genderOptions.find(o => o.id === gender)?.label,
        skinTone: skinToneOptions.find(o => o.id === skinTone)?.label,
        hairStyle: hairStyleOptions.find(o => o.id === hairStyle)?.label,
        expression: expressionOptions.find(o => o.id === expression)?.label,
        outfit: outfitOptions.find(o => o.id === outfit)?.label,
        pose: poseOptions.find(o => o.id === pose)?.label,
        accessory: accessoryOptions.find(o => o.id === accessory)?.label,
        background: backgroundOptions.find(o => o.id === background)?.label,
      },
      imageData: generatedImage || null,
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `projextpal-mascot-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("JSON configuratie gedownload!");
  };

  const [isGeneratingLayers, setIsGeneratingLayers] = useState(false);

  const handleDownloadLayers = async () => {
    if (!generatedImage) {
      toast.error("Genereer eerst een mascotte");
      return;
    }

    setIsGeneratingLayers(true);
    toast.info("Losse lagen worden gegenereerd...");

    try {
      const { data, error } = await supabase.functions.invoke("generate-mascot", {
        body: { 
          gender, skinTone, outfit, pose, accessory, hairStyle, expression, 
          background: "transparent",
          generateLayers: true 
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.layers) {
        // Download each layer
        for (const layer of data.layers) {
          const link = document.createElement("a");
          link.href = layer.image;
          link.download = `projextpal-mascot-${layer.name}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        toast.success(`${data.layers.length} lagen gedownload!`);
      } else {
        // Fallback: download current image with transparent background
        const link = document.createElement("a");
        link.href = generatedImage;
        link.download = `projextpal-mascot-full-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Mascotte afbeelding gedownload!");
      }
    } catch (err) {
      console.error("Error generating layers:", err);
      toast.error("Kon losse lagen niet genereren. Download de volledige afbeelding.");
    } finally {
      setIsGeneratingLayers(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!generatedImage) {
      toast.error("Genereer eerst een mascotte");
      return;
    }

    // Download PNG
    handleDownloadPNG();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Download JSON
    handleDownloadJSON();
    
    toast.success("Alle bestanden gedownload!");
  };

  const handleReset = () => {
    setGender("male");
    setSkinTone("light");
    setOutfit("casual");
    setPose("confident");
    setAccessory("none");
    setHairStyle("short");
    setExpression("happy");
    setBackground("white");
    setGeneratedImage(null);
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Creëer jouw <span className="text-gradient">Custom Pax</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ontwerp je eigen unieke mascotte door te kiezen uit verschillende opties!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Options Panel */}
          <div className="space-y-6 bg-card p-6 rounded-2xl border border-border max-h-[80vh] overflow-y-auto">
            {/* Gender */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Geslacht</h3>
              <div className="flex gap-3">
                {genderOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setGender(opt.id)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      gender === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Tone */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Huidskleur</h3>
              <div className="flex gap-3">
                {skinToneOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSkinTone(opt.id)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      skinTone === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-border"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Kapsel</h3>
              <div className="grid grid-cols-6 gap-2">
                {hairStyleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setHairStyle(opt.id)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      hairStyle === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Expression */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Expressie</h3>
              <div className="grid grid-cols-6 gap-2">
                {expressionOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setExpression(opt.id)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      expression === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Outfit</h3>
              <div className="grid grid-cols-4 gap-3">
                {outfitOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOutfit(opt.id)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      outfit === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pose */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Pose</h3>
              <div className="grid grid-cols-5 gap-2">
                {poseOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPose(opt.id)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      pose === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accessory */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Accessoire</h3>
              <div className="grid grid-cols-5 gap-2">
                {accessoryOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAccessory(opt.id)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      accessory === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Achtergrond</h3>
              <div className="grid grid-cols-6 gap-2">
                {backgroundOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setBackground(opt.id)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      background === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-border"
                      style={{ background: opt.color }}
                    />
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-card">
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1 gap-2"
                size="lg"
              >
                <Wand2 className="w-5 h-5" />
                {isLoading ? "Genereren..." : "Genereer Mascotte"}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-card p-6 rounded-2xl border border-border sticky top-24">
            <h3 className="font-semibold text-foreground mb-4 text-center">Preview</h3>
            <div className="aspect-square bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground text-center px-4">Even geduld, AI genereert je mascotte...</p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Custom generated mascot"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <Wand2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Kies je opties en klik op "Genereer Mascotte" om je unieke Pax te maken!
                  </p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="mt-4 space-y-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full gap-2" variant="secondary">
                      <Download className="w-4 h-4" />
                      Download
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleDownloadPNG} className="gap-2 cursor-pointer">
                      <FileImage className="w-4 h-4" />
                      <div>
                        <div className="font-medium">PNG Afbeelding</div>
                        <div className="text-xs text-muted-foreground">Standaard afbeelding formaat</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadJSON} className="gap-2 cursor-pointer">
                      <FileJson className="w-4 h-4" />
                      <div>
                        <div className="font-medium">JSON Configuratie</div>
                        <div className="text-xs text-muted-foreground">Instellingen + base64 afbeelding</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDownloadLayers} 
                      disabled={isGeneratingLayers}
                      className="gap-2 cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                      <div>
                        <div className="font-medium">
                          {isGeneratingLayers ? "Genereren..." : "Losse Lagen"}
                        </div>
                        <div className="text-xs text-muted-foreground">PNG bestanden per onderdeel</div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDownloadAll} className="gap-2 cursor-pointer">
                      <Package className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Alles Downloaden</div>
                        <div className="text-xs text-muted-foreground">PNG + JSON in één keer</div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Current Selection Summary */}
            <div className="mt-6 p-4 bg-muted/50 rounded-xl">
              <h4 className="text-sm font-semibold text-foreground mb-2">Huidige selectie:</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {genderOptions.find(o => o.id === gender)?.label}
                </span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {skinToneOptions.find(o => o.id === skinTone)?.label}
                </span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {hairStyleOptions.find(o => o.id === hairStyle)?.label}
                </span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {expressionOptions.find(o => o.id === expression)?.label}
                </span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {outfitOptions.find(o => o.id === outfit)?.label}
                </span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {poseOptions.find(o => o.id === pose)?.label}
                </span>
                {accessory !== "none" && (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {accessoryOptions.find(o => o.id === accessory)?.label}
                  </span>
                )}
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {backgroundOptions.find(o => o.id === background)?.label} BG
                </span>
              </div>
            </div>

            {/* Mascot Speaker Section */}
            {generatedImage && (
              <div className="mt-6 p-4 bg-card rounded-xl border border-border">
                <MascotSpeaker mascotImage={generatedImage} mascotName="Pax" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
