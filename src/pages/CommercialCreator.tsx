import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Video, 
  Play, 
  Download, 
  Loader2, 
  Volume2, 
  Pause,
  Sparkles,
  Clock,
  Megaphone,
  Tag,
  Wand2
} from "lucide-react";
import { toast } from "sonner";
import { BrandSelector, BrandKit, getBrandColors, getBrandLabel, getBrandLogo } from "@/components/BrandSelector";
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

type VoiceType = "female" | "male";

interface CommercialTemplate {
  id: string;
  name: string;
  duration: number;
  structure: { type: string; label: string; placeholder: string }[];
}

const templates: CommercialTemplate[] = [
  {
    id: "product-intro",
    name: "Product Introductie",
    duration: 15,
    structure: [
      { type: "hook", label: "Hook", placeholder: "Heb jij ook moeite met...?" },
      { type: "solution", label: "Oplossing", placeholder: "Onze oplossing helpt je hierbij!" },
      { type: "cta", label: "Call to Action", placeholder: "Start vandaag nog gratis!" },
    ],
  },
  {
    id: "feature-highlight",
    name: "Feature Highlight",
    duration: 20,
    structure: [
      { type: "intro", label: "Introductie", placeholder: "Ontdek de kracht van..." },
      { type: "feature", label: "Feature", placeholder: "Deze feature helpt je om..." },
      { type: "benefit", label: "Voordeel", placeholder: "Hierdoor bespaar je tijd!" },
      { type: "cta", label: "Call to Action", placeholder: "Probeer het nu!" },
    ],
  },
  {
    id: "testimonial",
    name: "Testimonial",
    duration: 30,
    structure: [
      { type: "problem", label: "Probleem", placeholder: "Voorheen had ik altijd..." },
      { type: "discovery", label: "Ontdekking", placeholder: "Toen ontdekte ik deze oplossing..." },
      { type: "result", label: "Resultaat", placeholder: "Nu is alles anders!" },
      { type: "recommend", label: "Aanbeveling", placeholder: "Ik raad het iedereen aan!" },
    ],
  },
];

const CommercialCreator = () => {
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CommercialTemplate>(templates[0]);
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<Record<string, string>>({});
  const [actorId, setActorId] = useState("pax");
  const [voice, setVoice] = useState<VoiceType>("female");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatingTTS, setGeneratingTTS] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [exportingVideo, setExportingVideo] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { loading: aiLoading, generateCommercial } = useAI();

  const getActorImage = () => {
    return actorOptions.find((a) => a.id === actorId)?.image || mascotDefault;
  };

  const getFullScript = () => {
    return selectedTemplate.structure
      .map((s) => sections[s.type] || "")
      .filter(Boolean)
      .join(" ");
  };

  const generateTTS = async () => {
    const script = getFullScript();
    if (!script.trim()) {
      toast.error("Vul eerst alle secties in");
      return;
    }

    setGeneratingTTS(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mascot-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: script,
            language: "nl",
            voiceId: voice === "male" ? "onwK4e9ZLuTAKqWW03F9" : "EXAVITQu4vr4xnSDxMaL",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAudioUrl(`data:audio/mpeg;base64,${data.audioContent}`);
      toast.success("Audio gegenereerd!");
    } catch (err) {
      console.error("TTS error:", err);
      toast.error("Kon audio niet genereren");
    } finally {
      setGeneratingTTS(false);
    }
  };

  const playAudio = () => {
    if (!audioUrl) return;

    if (playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingAudio(false);
    audio.play();
    setPlayingAudio(true);
  };

  const exportVideo = async () => {
    if (!audioUrl) {
      toast.error("Genereer eerst audio");
      return;
    }

    setExportingVideo(true);
    toast.info("Commercial wordt gegenereerd...");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080; // Square for social
      const ctx = canvas.getContext("2d")!;

      const audioContext = new AudioContext();
      const audioDestination = audioContext.createMediaStreamDestination();

      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: "video/webm" }));
        };
      });

      mediaRecorder.start();

      // Load actor image
      const actorImg = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = getActorImage();
      });

      // Load brand logo
      const logoImg = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = getBrandLogo(selectedBrandKit);
      });

      // Setup audio
      const audioElement = new Audio(audioUrl);
      const audioSource = audioContext.createMediaElementSource(audioElement);
      audioSource.connect(audioDestination);
      audioSource.connect(audioContext.destination);

      await new Promise<void>((resolve) => {
        audioElement.onloadedmetadata = () => resolve();
      });

      const duration = (audioElement.duration * 1000) + 500;
      audioElement.play();

      const startTime = Date.now();
      const sectionDuration = duration / selectedTemplate.structure.length;

      await new Promise<void>((resolve) => {
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentSectionIndex = Math.min(
            Math.floor(elapsed / sectionDuration),
            selectedTemplate.structure.length - 1
          );
          const currentSection = selectedTemplate.structure[currentSectionIndex];
          const currentText = sections[currentSection.type] || "";

          // Background gradient using brand colors
          const brandColors = getBrandColors(selectedBrandKit);
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, brandColors.primary);
          gradient.addColorStop(1, brandColors.secondary);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Animated particles
          ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
          for (let i = 0; i < 20; i++) {
            const x = (Math.sin(elapsed / 1000 + i) * 0.5 + 0.5) * canvas.width;
            const y = (Math.cos(elapsed / 800 + i * 2) * 0.5 + 0.5) * canvas.height;
            const size = 10 + Math.sin(elapsed / 500 + i) * 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }

          // Actor with bounce animation
          const bounce = Math.sin(elapsed / 200) * 10;
          const scale = 1 + Math.sin(elapsed / 300) * 0.03;
          
          ctx.save();
          ctx.translate(canvas.width / 2, 300 + bounce);
          ctx.scale(scale, scale);
          ctx.drawImage(actorImg, -150, -150, 300, 300);
          ctx.restore();

          // Speech bubble
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.beginPath();
          ctx.roundRect(100, 500, canvas.width - 200, 280, 30);
          ctx.fill();

          // Bubble pointer
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - 30, 500);
          ctx.lineTo(canvas.width / 2, 450);
          ctx.lineTo(canvas.width / 2 + 30, 500);
          ctx.fill();

          // Section label
          ctx.fillStyle = brandColors.primary;
          ctx.font = "bold 24px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(currentSection.label.toUpperCase(), canvas.width / 2, 550);

          // Text content
          ctx.fillStyle = "#1e293b";
          ctx.font = "36px system-ui";
          const words = currentText.split(" ");
          let line = "";
          let y = 620;
          for (const word of words) {
            const testLine = line + word + " ";
            if (ctx.measureText(testLine).width > canvas.width - 240) {
              ctx.fillText(line, canvas.width / 2, y);
              line = word + " ";
              y += 50;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, canvas.width / 2, y);

          // Progress bar
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fillRect(100, 850, canvas.width - 200, 8);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(100, 850, (canvas.width - 200) * progress, 8);

          // Timer
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 28px system-ui";
          ctx.textAlign = "right";
          const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
          ctx.fillText(`${remaining}s`, canvas.width - 100, 950);

          // Title with logo
          const logoSize = 60;
          ctx.drawImage(logoImg, 50, 30, logoSize, logoSize);
          
          if (title) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 48px system-ui";
            ctx.textAlign = "center";
            ctx.fillText(title, canvas.width / 2, 100);
          }

          // Brand label bottom right
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.font = "bold 20px system-ui";
          ctx.textAlign = "right";
          ctx.fillText(getBrandLabel(selectedBrandKit), canvas.width - 50, canvas.height - 30);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        animate();
      });

      audioElement.pause();
      mediaRecorder.stop();
      const videoBlob = await recordingPromise;

      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedBrandKit?.name || 'commercial'}-${title || "commercial"}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      await audioContext.close();
      toast.success("Commercial geëxporteerd!");
    } catch (error) {
      console.error("Video export error:", error);
      toast.error("Kon video niet exporteren");
    } finally {
      setExportingVideo(false);
    }
  };

  return (
    <div className="w-full">
      <main className="space-y-6">
        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Megaphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Commercial Creator</h1>
                <p className="text-sm text-muted-foreground">
                  Maak korte promo videos met templates
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportVideo}
                disabled={exportingVideo || !audioUrl}
                className="bg-gradient-to-r from-primary to-purple-600"
              >
                {exportingVideo ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {exportingVideo ? "Exporteren..." : "Export Video"}
              </Button>
            </div>
          </div>

          {/* Brand Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Kies Merk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BrandSelector 
                selectedBrand={selectedBrandKit?.id || null} 
                onBrandChange={(id, kit) => setSelectedBrandKit(kit)} 
              />
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Kies Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setSections({});
                      setAudioUrl(null);
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate.id === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      ~{template.duration}s
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commercial Title */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Commercial Titel
              </label>
              <div className="flex gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijv. Solutions - Jouw Partner in Innovatie"
                  className="text-lg flex-1"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (title) {
                      const duration = selectedTemplate.duration + 's' as '30s' | '60s' | '90s';
                      const result = await generateCommercial(title, duration, 'professional');
                      
                      // Fill in the sections based on template structure
                      const newSections: Record<string, string> = {};
                      if (result.hook) newSections.hook = result.hook;
                      if (result.script) {
                        // Split script into sections based on template
                        const scriptParts = result.script.split('. ').filter(Boolean);
                        selectedTemplate.structure.forEach((section, index) => {
                          if (scriptParts[index]) {
                            newSections[section.type] = scriptParts[index] + '.';
                          }
                        });
                      }
                      if (result.callToAction) newSections.cta = result.callToAction;
                      
                      setSections(newSections);
                      setAudioUrl(null);
                      toast.success("Commercial script gegenereerd met AI!");
                    }
                  }}
                  disabled={aiLoading || !title}
                  className="bg-gradient-to-r from-primary to-purple-600 text-white"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  AI Genereer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actor & Voice */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Kies Presentator
                </label>
                <div className="flex gap-2">
                  {actorOptions.map((actor) => (
                    <button
                      key={actor.id}
                      onClick={() => setActorId(actor.id)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        actorId === actor.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img src={actor.image} alt={actor.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Stem
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVoice("female")}
                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${
                      voice === "female"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    👩 Vrouwelijk
                  </button>
                  <button
                    onClick={() => setVoice("male")}
                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${
                      voice === "male"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    👨 Mannelijk
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Script Sections */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Script Secties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplate.structure.map((section, index) => (
                <div key={section.type}>
                  <label className="text-sm font-medium text-foreground mb-1 block flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    {section.label}
                  </label>
                  <Textarea
                    value={sections[section.type] || ""}
                    onChange={(e) => {
                      setSections({ ...sections, [section.type]: e.target.value });
                      setAudioUrl(null);
                    }}
                    placeholder={section.placeholder}
                    rows={2}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Audio Generation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={generateTTS}
                  disabled={generatingTTS}
                  className="flex-1"
                  variant="outline"
                >
                  {generatingTTS ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4 mr-2" />
                  )}
                  {generatingTTS ? "Genereren..." : "Genereer Audio"}
                </Button>

                {audioUrl && (
                  <Button onClick={playAudio} variant="outline" className="flex-1">
                    {playingAudio ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pauzeer
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Afspelen
                      </>
                    )}
                  </Button>
                )}
              </div>

              {audioUrl && (
                <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
                  ✓ Audio klaar - je kunt nu de video exporteren
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CommercialCreator;