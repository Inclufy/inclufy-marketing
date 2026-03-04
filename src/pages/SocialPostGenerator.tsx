import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Share2,
  Image as ImageIcon,
  Type,
  Palette,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Tag,
  Send,
  Wand2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { BrandSelector, BrandKit, getBrandColors, getBrandLabel, getBrandLogo } from "@/components/BrandSelector";
import { PublishDialog } from "@/components/PublishDialog";
import { useAI } from '@/hooks/use-ai';

// Actor images
import mascotDefault from "@/assets/projextpal-mascot.png";
import mascotAsian1 from "@/assets/mascot-asian-1.png";
import mascotBusinessCasual1 from "@/assets/mascot-business-casual-1.png";
import mascotFemale1 from "@/assets/mascot-female-1.png";
import mascotDarkSkin1 from "@/assets/mascot-dark-skin-1.png";

const actorOptions = [
  { id: "pax", label: "Pax", image: mascotDefault },
  { id: "asian1", label: "Asian", image: mascotAsian1 },
  { id: "business1", label: "Business", image: mascotBusinessCasual1 },
  { id: "female1", label: "Female", image: mascotFemale1 },
  { id: "dark1", label: "Diverse", image: mascotDarkSkin1 },
];

type FormatType = "square" | "story" | "landscape";

interface PostFormat {
  id: FormatType;
  label: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  platforms: string[];
}

const formats: PostFormat[] = [
  { id: "square", label: "Vierkant", width: 1080, height: 1080, icon: <Square className="w-4 h-4" />, platforms: ["Instagram", "Facebook", "LinkedIn"] },
  { id: "story", label: "Story", width: 1080, height: 1920, icon: <RectangleVertical className="w-4 h-4" />, platforms: ["Instagram Stories", "Facebook Stories"] },
  { id: "landscape", label: "Landschap", width: 1200, height: 628, icon: <RectangleHorizontal className="w-4 h-4" />, platforms: ["LinkedIn", "Twitter", "Facebook"] },
];

const colorSchemes = [
  { id: "magenta", name: "Inclufy", primary: "#db2777", secondary: "#7c3aed" },
  { id: "blue", name: "Ocean", primary: "#3b82f6", secondary: "#06b6d4" },
  { id: "green", name: "Nature", primary: "#10b981", secondary: "#84cc16" },
  { id: "orange", name: "Sunset", primary: "#f97316", secondary: "#eab308" },
  { id: "dark", name: "Dark", primary: "#1e293b", secondary: "#475569" },
];

const SocialPostGenerator = () => {
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null);
  const [format, setFormat] = useState<PostFormat>(formats[0]);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [actorId, setActorId] = useState("pax");
  const [colorScheme, setColorScheme] = useState(colorSchemes[0]);
  const [showActor, setShowActor] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { loading: aiLoading, generateSocialPost } = useAI();

  const getActorImage = () => {
    return actorOptions.find((a) => a.id === actorId)?.image || mascotDefault;
  };

  const generatePreview = async (downloadAfter = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scale for preview (max 400px width)
    const scale = Math.min(400 / format.width, 600 / format.height);
    canvas.width = format.width * scale;
    canvas.height = format.height * scale;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, format.width, format.height);
    gradient.addColorStop(0, colorScheme.primary);
    gradient.addColorStop(1, colorScheme.secondary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, format.width, format.height);

    // Decorative circles
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.arc(format.width * 0.85, format.height * 0.15, format.width * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(format.width * 0.1, format.height * 0.9, format.width * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Load and draw actor
    if (showActor) {
      const actorImg = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = getActorImage();
      });

      const actorSize = format.id === "story" ? format.width * 0.5 : format.width * 0.35;
      const actorX = format.id === "landscape" ? format.width * 0.75 : format.width * 0.5;
      const actorY = format.id === "story" ? format.height * 0.35 : format.height * 0.4;

      ctx.drawImage(
        actorImg,
        actorX - actorSize / 2,
        actorY - actorSize / 2,
        actorSize,
        actorSize
      );
    }

    // Text positioning based on format
    const textY = format.id === "story" 
      ? format.height * 0.7 
      : showActor 
        ? format.height * 0.75 
        : format.height * 0.5;

    // Headline
    if (headline) {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      const headlineSize = format.id === "story" ? 72 : format.id === "landscape" ? 56 : 64;
      ctx.font = `bold ${headlineSize}px system-ui`;

      // Word wrap
      const maxWidth = format.width * 0.85;
      const words = headline.split(" ");
      let line = "";
      let y = textY;
      const lineHeight = headlineSize * 1.2;

      for (const word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxWidth && line !== "") {
          ctx.fillText(line.trim(), format.width / 2, y);
          line = word + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), format.width / 2, y);

      // Subtext
      if (subtext) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        const subtextSize = format.id === "story" ? 36 : format.id === "landscape" ? 28 : 32;
        ctx.font = `${subtextSize}px system-ui`;
        ctx.fillText(subtext, format.width / 2, y + lineHeight + 20);
      }
    }

    // Load and draw brand logo
    const logoImg = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.src = getBrandLogo(selectedBrandKit);
    });

    const logoSize = format.id === "story" ? 80 : 60;
    const logoX = format.id === "landscape" ? 40 : format.width / 2 - logoSize / 2;
    const logoY = format.height - logoSize - 20;
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

    // Brand label next to logo
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 20px system-ui";
    ctx.textAlign = format.id === "landscape" ? "left" : "center";
    const labelX = format.id === "landscape" ? logoX + logoSize + 12 : format.width / 2;
    const labelY = format.id === "landscape" ? logoY + logoSize / 2 + 6 : format.height - 10;
    ctx.fillText(getBrandLabel(selectedBrandKit), labelX, labelY);

    if (downloadAfter) {
      // Create full-size canvas for download
      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = format.width;
      fullCanvas.height = format.height;
      const fullCtx = fullCanvas.getContext("2d")!;

      // Redraw at full size
      const fullGradient = fullCtx.createLinearGradient(0, 0, format.width, format.height);
      fullGradient.addColorStop(0, colorScheme.primary);
      fullGradient.addColorStop(1, colorScheme.secondary);
      fullCtx.fillStyle = fullGradient;
      fullCtx.fillRect(0, 0, format.width, format.height);

      // Decorative circles
      fullCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
      fullCtx.beginPath();
      fullCtx.arc(format.width * 0.85, format.height * 0.15, format.width * 0.25, 0, Math.PI * 2);
      fullCtx.fill();
      fullCtx.beginPath();
      fullCtx.arc(format.width * 0.1, format.height * 0.9, format.width * 0.2, 0, Math.PI * 2);
      fullCtx.fill();

      if (showActor) {
        const actorImg = await new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.src = getActorImage();
        });

        const actorSize = format.id === "story" ? format.width * 0.5 : format.width * 0.35;
        const actorX = format.id === "landscape" ? format.width * 0.75 : format.width * 0.5;
        const actorY = format.id === "story" ? format.height * 0.35 : format.height * 0.4;

        fullCtx.drawImage(
          actorImg,
          actorX - actorSize / 2,
          actorY - actorSize / 2,
          actorSize,
          actorSize
        );
      }

      const fullTextY = format.id === "story" 
        ? format.height * 0.7 
        : showActor 
          ? format.height * 0.75 
          : format.height * 0.5;

      if (headline) {
        fullCtx.fillStyle = "#ffffff";
        fullCtx.textAlign = "center";
        const headlineSize = format.id === "story" ? 72 : format.id === "landscape" ? 56 : 64;
        fullCtx.font = `bold ${headlineSize}px system-ui`;

        const maxWidth = format.width * 0.85;
        const words = headline.split(" ");
        let line = "";
        let y = fullTextY;
        const lineHeight = headlineSize * 1.2;

        for (const word of words) {
          const testLine = line + word + " ";
          if (fullCtx.measureText(testLine).width > maxWidth && line !== "") {
            fullCtx.fillText(line.trim(), format.width / 2, y);
            line = word + " ";
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        fullCtx.fillText(line.trim(), format.width / 2, y);

        if (subtext) {
          fullCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
          const subtextSize = format.id === "story" ? 36 : format.id === "landscape" ? 28 : 32;
          fullCtx.font = `${subtextSize}px system-ui`;
          fullCtx.fillText(subtext, format.width / 2, y + lineHeight + 20);
        }
      }

      // Draw brand logo (use same logoImg loaded earlier)
      const fullLogoSize = format.id === "story" ? 80 : 60;
      const fullLogoX = format.id === "landscape" ? 40 : format.width / 2 - fullLogoSize / 2;
      const fullLogoY = format.height - fullLogoSize - 20;
      fullCtx.drawImage(logoImg, fullLogoX, fullLogoY, fullLogoSize, fullLogoSize);

      // Brand label
      fullCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
      fullCtx.font = "bold 20px system-ui";
      fullCtx.textAlign = format.id === "landscape" ? "left" : "center";
      const fullLabelX = format.id === "landscape" ? fullLogoX + fullLogoSize + 12 : format.width / 2;
      const fullLabelY = format.id === "landscape" ? fullLogoY + fullLogoSize / 2 + 6 : format.height - 10;
      fullCtx.fillText(getBrandLabel(selectedBrandKit), fullLabelX, fullLabelY);

      // Download
      const link = document.createElement("a");
      link.download = `${selectedBrandKit?.name || 'brand'}-${format.id}-${Date.now()}.png`;
      link.href = fullCanvas.toDataURL("image/png");
      link.click();
      toast.success("Afbeelding gedownload!");
      return fullCanvas.toDataURL("image/png");
    }
  };

  const getImageBase64 = async (): Promise<string> => {
    // Create full-size canvas for export
    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = format.width;
    fullCanvas.height = format.height;
    const fullCtx = fullCanvas.getContext("2d")!;

    // Redraw at full size
    const fullGradient = fullCtx.createLinearGradient(0, 0, format.width, format.height);
    fullGradient.addColorStop(0, colorScheme.primary);
    fullGradient.addColorStop(1, colorScheme.secondary);
    fullCtx.fillStyle = fullGradient;
    fullCtx.fillRect(0, 0, format.width, format.height);

    // Decorative circles
    fullCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
    fullCtx.beginPath();
    fullCtx.arc(format.width * 0.85, format.height * 0.15, format.width * 0.25, 0, Math.PI * 2);
    fullCtx.fill();
    fullCtx.beginPath();
    fullCtx.arc(format.width * 0.1, format.height * 0.9, format.width * 0.2, 0, Math.PI * 2);
    fullCtx.fill();

    if (showActor) {
      const actorImg = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = getActorImage();
      });

      const actorSize = format.id === "story" ? format.width * 0.5 : format.width * 0.35;
      const actorX = format.id === "landscape" ? format.width * 0.75 : format.width * 0.5;
      const actorY = format.id === "story" ? format.height * 0.35 : format.height * 0.4;

      fullCtx.drawImage(
        actorImg,
        actorX - actorSize / 2,
        actorY - actorSize / 2,
        actorSize,
        actorSize
      );
    }

    const fullTextY = format.id === "story" 
      ? format.height * 0.7 
      : showActor 
        ? format.height * 0.75 
        : format.height * 0.5;

    if (headline) {
      fullCtx.fillStyle = "#ffffff";
      fullCtx.textAlign = "center";
      const headlineSize = format.id === "story" ? 72 : format.id === "landscape" ? 56 : 64;
      fullCtx.font = `bold ${headlineSize}px system-ui`;

      const maxWidth = format.width * 0.85;
      const words = headline.split(" ");
      let line = "";
      let y = fullTextY;
      const lineHeight = headlineSize * 1.2;

      for (const word of words) {
        const testLine = line + word + " ";
        if (fullCtx.measureText(testLine).width > maxWidth && line !== "") {
          fullCtx.fillText(line.trim(), format.width / 2, y);
          line = word + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      fullCtx.fillText(line.trim(), format.width / 2, y);

      if (subtext) {
        fullCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
        const subtextSize = format.id === "story" ? 36 : format.id === "landscape" ? 28 : 32;
        fullCtx.font = `${subtextSize}px system-ui`;
        fullCtx.fillText(subtext, format.width / 2, y + lineHeight + 20);
      }
    }

    // Load and draw brand logo
    const logoImg = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.src = getBrandLogo(selectedBrandKit);
    });

    const fullLogoSize = format.id === "story" ? 80 : 60;
    const fullLogoX = format.id === "landscape" ? 40 : format.width / 2 - fullLogoSize / 2;
    const fullLogoY = format.height - fullLogoSize - 20;
    fullCtx.drawImage(logoImg, fullLogoX, fullLogoY, fullLogoSize, fullLogoSize);

    // Brand label
    fullCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
    fullCtx.font = "bold 20px system-ui";
    fullCtx.textAlign = format.id === "landscape" ? "left" : "center";
    const fullLabelX = format.id === "landscape" ? fullLogoX + fullLogoSize + 12 : format.width / 2;
    const fullLabelY = format.id === "landscape" ? fullLogoY + fullLogoSize / 2 + 6 : format.height - 10;
    fullCtx.fillText(getBrandLabel(selectedBrandKit), fullLabelX, fullLabelY);

    return fullCanvas.toDataURL("image/png");
  };

  // Generate preview on changes
  useState(() => {
    generatePreview();
  });

  return (
    <div className="w-full">
      <main className="space-y-6">
        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Social Post Generator</h1>
                <p className="text-sm text-muted-foreground">
                  Maak afbeeldingen voor social media
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <PublishDialog getImageBase64={getImageBase64}>
                <Button variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Publiceren
                </Button>
              </PublishDialog>
              <Button
                onClick={() => generatePreview(true)}
                className="bg-gradient-to-r from-primary to-purple-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings */}
            <div className="space-y-6">
              {/* Brand Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Merk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BrandSelector 
                    selectedBrand={selectedBrandKit?.id || null} 
                    onBrandChange={(id, kit) => {
                      setSelectedBrandKit(kit);
                      setTimeout(() => generatePreview(), 100);
                    }} 
                  />
                </CardContent>
              </Card>

              {/* Format */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Formaat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {formats.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setFormat(f);
                          setTimeout(() => generatePreview(), 100);
                        }}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          format.id === f.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex justify-center mb-2">{f.icon}</div>
                        <div className="font-medium text-sm">{f.label}</div>
                        <div className="text-xs text-muted-foreground">{f.width}x{f.height}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Geschikt voor: {format.platforms.join(", ")}
                  </p>
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Type className="w-5 h-5 text-primary" />
                    Tekst
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const topic = prompt("Waarover gaat je social post?");
                        if (topic) {
                          const platform = format.platforms[0].toLowerCase().includes('instagram') ? 'instagram' : 
                                          format.platforms[0].toLowerCase().includes('linkedin') ? 'linkedin' : 'twitter';
                          
                          const result = await generateSocialPost(
                            topic,
                            platform as 'twitter' | 'linkedin' | 'instagram',
                            'engaging'
                          );
                          
                          setHeadline(result.content.split('\n')[0] || result.content.substring(0, 50));
                          setSubtext(result.hashtags.join(' '));
                          setTimeout(() => generatePreview(), 100);
                          toast.success("Social post gegenereerd met AI!");
                        }
                      }}
                      disabled={aiLoading}
                      className="ml-auto bg-gradient-to-r from-primary to-purple-600 text-white"
                    >
                      {aiLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3 mr-1" />
                      )}
                      AI
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Headline</label>
                    <Input
                      value={headline}
                      onChange={(e) => {
                        setHeadline(e.target.value);
                        setTimeout(() => generatePreview(), 100);
                      }}
                      placeholder="Jouw pakkende tekst"
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Subtekst</label>
                    <Textarea
                      value={subtext}
                      onChange={(e) => {
                        setSubtext(e.target.value);
                        setTimeout(() => generatePreview(), 100);
                      }}
                      placeholder="Extra informatie of call-to-action"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Colors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Kleurenschema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {colorSchemes.map((scheme) => (
                      <button
                        key={scheme.id}
                        onClick={() => {
                          setColorScheme(scheme);
                          setTimeout(() => generatePreview(), 100);
                        }}
                        className={`w-12 h-12 rounded-xl border-2 transition-all overflow-hidden ${
                          colorScheme.id === scheme.id
                            ? "border-foreground ring-2 ring-foreground/20"
                            : "border-transparent"
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${scheme.primary}, ${scheme.secondary})`,
                        }}
                        title={scheme.name}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mascot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showActor}
                      onChange={(e) => {
                        setShowActor(e.target.checked);
                        setTimeout(() => generatePreview(), 100);
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Toon mascot</span>
                  </label>

                  {showActor && (
                    <div className="flex gap-2">
                      {actorOptions.map((actor) => (
                        <button
                          key={actor.id}
                          onClick={() => {
                            setActorId(actor.id);
                            setTimeout(() => generatePreview(), 100);
                          }}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                            actorId === actor.id
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <img src={actor.image} alt={actor.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="lg:sticky lg:top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center bg-muted/50 rounded-xl p-4">
                    <canvas
                      ref={canvasRef}
                      className="rounded-lg shadow-lg max-w-full"
                      style={{ maxHeight: "600px" }}
                    />
                  </div>
                  <Button
                    onClick={() => generatePreview()}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    Vernieuw Preview
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SocialPostGenerator;