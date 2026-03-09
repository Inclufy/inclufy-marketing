import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Play, 
  Download,
  ChevronUp,
  ChevronDown,
  Eye,
  Wand2,
  BookOpen,
  Volume2,
  Loader2,
  ImagePlus,
  User,
  Pause,
  Video,
  Tag
} from "lucide-react";
import { toast } from "sonner";
import { BrandSelector, BrandKit, getBrandColors, getBrandLabel, getBrandLogo } from "@/components/BrandSelector";
import mascotDefault from "@/assets/projextpal-mascot.png";
import { useLanguage } from '@/contexts/LanguageContext';

// AI Hook Import - Zorg dat dit pad klopt!
import { useAI } from "../hooks/use-ai";

// Available actor images
import mascotAsian1 from "@/assets/mascot-asian-1.png";
import mascotAsian2 from "@/assets/mascot-asian-2.png";
import mascotBusinessCasual1 from "@/assets/mascot-business-casual-1.png";
import mascotBusinessCasual2 from "@/assets/mascot-business-casual-2.png";
import mascotBusinessCasual3 from "@/assets/mascot-business-casual-3.png";
import mascotBusinessCasual4 from "@/assets/mascot-business-casual-4.png";
import mascotDarkSkin1 from "@/assets/mascot-dark-skin-1.png";
import mascotDarkSkin2 from "@/assets/mascot-dark-skin-2.png";
import mascotFemale1 from "@/assets/mascot-female-1.png";
import mascotFemale2 from "@/assets/mascot-female-2.png";
import mascotFemale3 from "@/assets/mascot-female-3.png";
import mascotFemale4 from "@/assets/mascot-female-4.png";
import mascotTanSkin1 from "@/assets/mascot-tan-skin-1.png";
import mascotTanSkin2 from "@/assets/mascot-tan-skin-2.png";

const actorOptions = [
  { id: "pax", label: "Pax (Default)", image: mascotDefault },
  { id: "asian1", label: "Asian 1", image: mascotAsian1 },
  { id: "asian2", label: "Asian 2", image: mascotAsian2 },
  { id: "business1", label: "Business 1", image: mascotBusinessCasual1 },
  { id: "business2", label: "Business 2", image: mascotBusinessCasual2 },
  { id: "business3", label: "Business 3", image: mascotBusinessCasual3 },
  { id: "business4", label: "Business 4", image: mascotBusinessCasual4 },
  { id: "dark1", label: "Dark Skin 1", image: mascotDarkSkin1 },
  { id: "dark2", label: "Dark Skin 2", image: mascotDarkSkin2 },
  { id: "female1", label: "Female 1", image: mascotFemale1 },
  { id: "female2", label: "Female 2", image: mascotFemale2 },
  { id: "female3", label: "Female 3", image: mascotFemale3 },
  { id: "female4", label: "Female 4", image: mascotFemale4 },
  { id: "tan1", label: "Tan Skin 1", image: mascotTanSkin1 },
  { id: "tan2", label: "Tan Skin 2", image: mascotTanSkin2 },
];

type VoiceType = "female" | "male";

const voiceOptions: { id: VoiceType; nl: string; fr: string; en: string; icon: string }[] = [
  { id: "female", nl: "Vrouwelijk", fr: "Féminin", en: "Female", icon: "👩" },
  { id: "male", nl: "Mannelijk", fr: "Masculin", en: "Male", icon: "👨" },
];

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  mascotMessage: string;
  actorId: string;
  voice: VoiceType;
  customActorImage?: string;
  audioUrl?: string;
}

const TutorialCreator = () => {
  const { lang } = useLanguage(); const nl = lang === 'nl'; const fr = lang === 'fr';
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null);
  const [tutorialTitle, setTutorialTitle] = useState("");
  const [steps, setSteps] = useState<TutorialStep[]>([
    {
      id: crypto.randomUUID(),
      title: nl ? "Stap 1" : fr ? "Étape 1" : "Step 1",
      content: "",
      mascotMessage: nl ? "Welkom bij de tutorial!" : fr ? "Bienvenue dans le tutoriel !" : "Welcome to the tutorial!",
      actorId: "pax",
      voice: "female",
    },
  ]);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(0);
  const [generatingTTS, setGeneratingTTS] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [exportingVideo, setExportingVideo] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // AI Hook
  const { loading: aiLoading, generateTutorial } = useAI();

  const addStep = () => {
    const newStep: TutorialStep = {
      id: crypto.randomUUID(),
      title: nl ? `Stap ${steps.length + 1}` : fr ? `Étape ${steps.length + 1}` : `Step ${steps.length + 1}`,
      content: "",
      mascotMessage: "",
      actorId: "pax",
      voice: "female",
    };
    setSteps([...steps, newStep]);
    toast.success(nl ? "Nieuwe stap toegevoegd" : fr ? "Nouvelle étape ajoutée" : "New step added");
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) {
      toast.error(nl ? "Je hebt minimaal 1 stap nodig" : fr ? "Vous avez besoin d'au moins 1 étape" : "You need at least 1 step");
      return;
    }
    setSteps(steps.filter((s) => s.id !== id));
    toast.success(nl ? "Stap verwijderd" : fr ? "Étape supprimée" : "Step removed");
  };

  const updateStep = (id: string, field: keyof TutorialStep, value: string) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const handleCustomImageUpload = (stepId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSteps(steps.map((s) => 
        s.id === stepId 
          ? { ...s, actorId: "custom", customActorImage: imageUrl } 
          : s
      ));
      toast.success(nl ? "Afbeelding geüpload" : fr ? "Image téléchargée" : "Image uploaded");
    };
    reader.readAsDataURL(file);
  };

  const generateTTS = async (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step?.mascotMessage.trim()) {
      toast.error(nl ? "Voer eerst een mascot-bericht in" : fr ? "Entrez d'abord un message du mascotte" : "Enter a mascot message first");
      return;
    }

    setGeneratingTTS(stepId);
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
            text: step.mascotMessage, 
            language: "nl",
            voiceId: step.voice === "male" ? "onwK4e9ZLuTAKqWW03F9" : "EXAVITQu4vr4xnSDxMaL"
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      setSteps(steps.map((s) => 
        s.id === stepId ? { ...s, audioUrl } : s
      ));
      toast.success(nl ? "Spraak gegenereerd!" : fr ? "Voix générée !" : "Speech generated!");
    } catch (err) {
      console.error("TTS error:", err);
      toast.error(nl ? "Kon spraak niet genereren" : fr ? "Impossible de générer la voix" : "Could not generate speech");
    } finally {
      setGeneratingTTS(null);
    }
  };

  const playAudio = (stepId: string, audioUrl: string) => {
    if (playingAudio === stepId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingAudio(null);
    audio.play();
    setPlayingAudio(stepId);
  };

  const getActorImage = (step: TutorialStep): string => {
    if (step.actorId === "custom" && step.customActorImage) {
      return step.customActorImage;
    }
    return actorOptions.find((a) => a.id === step.actorId)?.image || mascotDefault;
  };

  const exportTutorial = () => {
    const tutorial = {
      title: tutorialTitle || (nl ? "Mijn Tutorial" : fr ? "Mon Tutoriel" : "My Tutorial"),
      steps: steps.map((s, i) => ({
        order: i + 1,
        title: s.title,
        content: s.content,
        mascotMessage: s.mascotMessage,
        actorId: s.actorId,
        hasAudio: !!s.audioUrl,
      })),
      createdAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(tutorial, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tutorialTitle || "tutorial"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(nl ? "Tutorial geëxporteerd!" : fr ? "Tutoriel exporté !" : "Tutorial exported!");
  };

  // Export video with audio
  const exportVideo = async () => {
    const stepsWithAudio = steps.filter((s) => s.audioUrl);
    if (stepsWithAudio.length === 0) {
      toast.error(nl ? "Genereer eerst spraak voor minimaal 1 stap" : fr ? "Générez d'abord la voix pour au moins 1 étape" : "Generate speech for at least 1 step first");
      return;
    }

    setExportingVideo(true);
    toast.info(nl ? "Video wordt gegenereerd..." : fr ? "Vidéo en cours de génération..." : "Video is being generated...");

    try {
      // Create offscreen canvas
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d")!;
      videoCanvasRef.current = canvas;

      // Create audio context for combining audio
      const audioContext = new AudioContext();
      const audioDestination = audioContext.createMediaStreamDestination();

      // Create combined stream (video + audio)
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);

      // Setup MediaRecorder
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

      // Load brand logo once
      const logoImg = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = getBrandLogo(selectedBrandKit);
      });

      // Process each step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const actorImageSrc = getActorImage(step);

        // Load actor image
        const actorImg = await new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.src = actorImageSrc;
        });

        // Determine step duration
        let stepDuration = 3000; // Default 3s for steps without audio
        let audioElement: HTMLAudioElement | null = null;
        let audioSource: MediaElementAudioSourceNode | null = null;

        if (step.audioUrl) {
          audioElement = new Audio(step.audioUrl);
          audioSource = audioContext.createMediaElementSource(audioElement);
          audioSource.connect(audioDestination);
          audioSource.connect(audioContext.destination); // Also play locally for sync
          
          // Get audio duration
          await new Promise<void>((resolve) => {
            audioElement!.onloadedmetadata = () => resolve();
          });
          stepDuration = (audioElement.duration * 1000) + 500; // Add 500ms buffer
        }

        // Play audio if available
        if (audioElement) {
          audioElement.play();
        }

        // Animate this step
        const startTime = Date.now();
        await new Promise<void>((resolve) => {
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / stepDuration, 1);

            // Clear canvas
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw gradient background using brand colors
            const brandColors = getBrandColors(selectedBrandKit);
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, "#eff6ff");
            gradient.addColorStop(1, "#f0fdf4");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw step number badge with brand color
            ctx.fillStyle = brandColors.primary;
            ctx.beginPath();
            ctx.arc(100, 80, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 28px system-ui";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${i + 1}`, 100, 80);

            // Draw step title
            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 36px system-ui";
            ctx.textAlign = "left";
            ctx.fillText(step.title, 160, 85);

            // Draw actor with subtle animation
            const bounce = Math.sin(elapsed / 200) * 5;
            const scale = 1 + Math.sin(elapsed / 300) * 0.02;
            
            ctx.save();
            ctx.translate(200, 380 + bounce);
            ctx.scale(scale, scale);
            ctx.drawImage(actorImg, -120, -150, 240, 300);
            ctx.restore();

            // Draw speech bubble
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 2;
            
            // Bubble shape
            ctx.beginPath();
            ctx.roundRect(380, 200, 820, 200, 20);
            ctx.fill();
            ctx.stroke();

            // Bubble pointer
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(380, 280);
            ctx.lineTo(340, 310);
            ctx.lineTo(380, 340);
            ctx.fill();

            // Speech text
            ctx.fillStyle = "#1e293b";
            ctx.font = "24px system-ui";
            ctx.textAlign = "left";
            const words = step.mascotMessage.split(" ");
            let line = "";
            let y = 260;
            for (const word of words) {
              const testLine = line + word + " ";
              if (ctx.measureText(testLine).width > 780) {
                ctx.fillText(line, 410, y);
                line = word + " ";
                y += 35;
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, 410, y);

            // Draw content area
            ctx.fillStyle = "#f1f5f9";
            ctx.beginPath();
            ctx.roundRect(380, 450, 820, 200, 15);
            ctx.fill();

            ctx.fillStyle = "#475569";
            ctx.font = "20px system-ui";
            const contentWords = step.content.split(" ");
            let contentLine = "";
            let contentY = 490;
            for (const word of contentWords) {
              const testLine = contentLine + word + " ";
              if (ctx.measureText(testLine).width > 780) {
                ctx.fillText(contentLine, 410, contentY);
                contentLine = word + " ";
                contentY += 30;
                if (contentY > 630) break;
              } else {
                contentLine = testLine;
              }
            }
            ctx.fillText(contentLine, 410, contentY);

            // Progress bar with brand color
            ctx.fillStyle = "#e2e8f0";
            ctx.fillRect(50, 680, canvas.width - 100, 10);
            ctx.fillStyle = brandColors.primary;
            const totalProgress = (i + progress) / steps.length;
            ctx.fillRect(50, 680, (canvas.width - 100) * totalProgress, 10);

            // Brand logo in bottom right
            const logoSize = 50;
            ctx.drawImage(logoImg, canvas.width - logoSize - 50, 680 - logoSize - 20, logoSize, logoSize);

            // Brand label
            ctx.fillStyle = "#64748b";
            ctx.font = "16px system-ui";
            ctx.textAlign = "right";
            ctx.fillText(getBrandLabel(selectedBrandKit), canvas.width - 50, 680 - 10);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              resolve();
            }
          };
          animate();
        });

        // Clean up audio for this step
        if (audioElement) {
          audioElement.pause();
        }
      }

      // Stop recording
      mediaRecorder.stop();
      const videoBlob = await recordingPromise;

      // Download video
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedBrandKit?.name || 'tutorial'}-${tutorialTitle || "tutorial"}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      await audioContext.close();
      toast.success(nl ? "Video geëxporteerd!" : fr ? "Vidéo exportée !" : "Video exported!");
    } catch (error) {
      console.error("Video export error:", error);
      toast.error(nl ? "Kon video niet exporteren" : fr ? "Impossible d'exporter la vidéo" : "Could not export video");
    } finally {
      setExportingVideo(false);
    }
  };

  const togglePreview = () => {
    if (!previewMode && steps.some((s) => !s.content.trim())) {
      toast.error(nl ? "Vul eerst alle stappen in" : fr ? "Remplissez d'abord toutes les étapes" : "Fill in all steps first");
      return;
    }
    setPreviewMode(!previewMode);
    setCurrentPreviewStep(0);
  };

  // Preview mode UI
  if (previewMode) {
    const currentStep = steps[currentPreviewStep];
    const actorImage = getActorImage(currentStep);

    return (
      <div className="w-full">
        <main className="space-y-6">
          <div className="w-full">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                {tutorialTitle || (nl ? "Tutorial Voorbeeld" : fr ? "Aperçu du tutoriel" : "Tutorial Preview")}
              </h1>
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                {nl ? "Terug naar bewerken" : fr ? "Retour à l'édition" : "Back to editing"}
              </Button>
            </div>

            {/* Progress bar */}
            <div className="flex gap-2 mb-8">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i <= currentPreviewStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Actor + Speech bubble */}
            <div className="flex gap-6 mb-8">
              <div className="relative flex-shrink-0">
                <img
                  src={actorImage}
                  alt="Tutorial actor"
                  className="w-32 h-32 object-contain animate-bounce-subtle rounded-xl"
                />
                {currentStep.audioUrl && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-10 h-10"
                    onClick={() => playAudio(currentStep.id, currentStep.audioUrl!)}
                  >
                    {playingAudio === currentStep.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              <div className="flex-1 bg-muted rounded-2xl rounded-bl-none p-6 relative">
                <div className="absolute -left-3 bottom-6 w-6 h-6 bg-muted transform rotate-45" />
                <p className="text-lg text-foreground relative z-10">
                  {currentStep.mascotMessage || "..."}
                </p>
              </div>
            </div>

            {/* Step content */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {currentPreviewStep + 1}
                  </span>
                  {currentStep.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {currentStep.content}
                </p>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={currentPreviewStep === 0}
                onClick={() => setCurrentPreviewStep((p) => p - 1)}
              >
                {nl ? "Vorige" : fr ? "Précédent" : "Previous"}
              </Button>
              <span className="text-muted-foreground">
                {nl ? `Stap ${currentPreviewStep + 1} van ${steps.length}` : fr ? `Étape ${currentPreviewStep + 1} sur ${steps.length}` : `Step ${currentPreviewStep + 1} of ${steps.length}`}
              </span>
              <Button
                disabled={currentPreviewStep === steps.length - 1}
                onClick={() => setCurrentPreviewStep((p) => p + 1)}
              >
                {nl ? "Volgende" : fr ? "Suivant" : "Next"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Editor mode UI
  return (
    <div className="w-full">
      <main className="space-y-6">
        <div className="w-full">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{nl ? "Tutorial Creator" : fr ? "Créateur de tutoriels" : "Tutorial Creator"}</h1>
                <p className="text-sm text-muted-foreground">
                  {nl ? "Maak stap-voor-stap tutorials met spraak" : fr ? "Créez des tutoriels étape par étape avec la voix" : "Create step-by-step tutorials with speech"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={togglePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={exportTutorial}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button 
                onClick={exportVideo} 
                disabled={exportingVideo}
                className="bg-gradient-to-r from-primary to-purple-600"
              >
                {exportingVideo ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Video className="w-4 h-4 mr-2" />
                )}
                {exportingVideo ? (nl ? "Exporteren..." : fr ? "Exportation..." : "Exporting...") : "Video"}
              </Button>
            </div>
          </div>

          {/* Brand Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                {nl ? "Kies Merk" : fr ? "Choisir la marque" : "Choose Brand"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BrandSelector 
                selectedBrand={selectedBrandKit?.id || null} 
                onBrandChange={(id, kit) => setSelectedBrandKit(kit)} 
              />
            </CardContent>
          </Card>

          {/* Tutorial title */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                {nl ? "Tutorial Titel" : fr ? "Titre du tutoriel" : "Tutorial Title"}
              </label>
              <div className="flex gap-2">
                <Input
                  value={tutorialTitle}
                  onChange={(e) => setTutorialTitle(e.target.value)}
                  placeholder={nl ? "Bijv. Onboarding nieuwe medewerker" : fr ? "Ex. Intégration d'un nouvel employé" : "E.g., Onboarding new employee"}
                  className="text-lg flex-1"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (tutorialTitle) {
                      try {
                        const result = await generateTutorial(tutorialTitle);
                        setTutorialTitle(result.title);
                        setSteps(result.steps.map((step: any, i: number) => ({
                          id: crypto.randomUUID(),
                          title: step.title,
                          content: step.content,
                          mascotMessage: nl ? `Hier is stap ${i + 1}!` : fr ? `Voici l'étape ${i + 1} !` : `Here is step ${i + 1}!`,
                          actorId: "pax",
                          voice: "female",
                        })));
                        toast.success(nl ? "Tutorial gegenereerd met AI!" : fr ? "Tutoriel généré avec l'IA !" : "Tutorial generated with AI!");
                      } catch (error) {
                        toast.error(nl ? "AI generatie mislukt. Check je API key." : fr ? "Échec de la génération IA. Vérifiez votre clé API." : "AI generation failed. Check your API key.");
                        console.error(error);
                      }
                    }
                  }}
                  disabled={aiLoading || !tutorialTitle}
                  className="bg-gradient-to-r from-primary to-purple-600 text-white"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  {nl ? "AI Genereer" : fr ? "Générer IA" : "AI Generate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Steps list */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={step.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Drag handle + order controls */}
                    <div className="flex flex-col items-center gap-1 pt-2">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                      <button
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-muted rounded disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                        className="p-1 hover:bg-muted rounded disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 space-y-4">
                      <Input
                        value={step.title}
                        onChange={(e) => updateStep(step.id, "title", e.target.value)}
                        placeholder={nl ? "Stap titel" : fr ? "Titre de l'étape" : "Step title"}
                        className="font-medium"
                      />

                      {/* Actor selection */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {nl ? "Kies acteur:" : fr ? "Choisir l'acteur :" : "Choose actor:"}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {actorOptions.slice(0, 8).map((actor) => (
                            <button
                              key={actor.id}
                              onClick={() => updateStep(step.id, "actorId", actor.id)}
                              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                step.actorId === actor.id 
                                  ? "border-primary ring-2 ring-primary/30" 
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <img 
                                src={actor.image} 
                                alt={actor.label} 
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                          {/* Custom upload button */}
                          <button
                            onClick={() => fileInputRefs.current[step.id]?.click()}
                            className={`w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
                              step.actorId === "custom"
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {step.actorId === "custom" && step.customActorImage ? (
                              <img 
                                src={step.customActorImage} 
                                alt="Custom" 
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <ImagePlus className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          <input
                            ref={(el) => { fileInputRefs.current[step.id] = el; }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCustomImageUpload(step.id, file);
                            }}
                          />
                        </div>
                      </div>

                      {/* Voice selection */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                          <Volume2 className="w-3 h-3" />
                          {nl ? "Kies stem:" : fr ? "Choisir la voix :" : "Choose voice:"}
                        </label>
                        <div className="flex gap-2">
                          {voiceOptions.map((voice) => (
                            <button
                              key={voice.id}
                              onClick={() => updateStep(step.id, "voice", voice.id)}
                              className={`px-3 py-1.5 rounded-lg border-2 flex items-center gap-2 text-sm transition-all ${
                                step.voice === voice.id
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <span>{voice.icon}</span>
                              {nl ? voice.nl : fr ? voice.fr : voice.en}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mascot message with TTS */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                          <Wand2 className="w-3 h-3" />
                          {nl ? "Acteur zegt:" : fr ? "L'acteur dit :" : "Actor says:"}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={step.mascotMessage}
                            onChange={(e) =>
                              updateStep(step.id, "mascotMessage", e.target.value)
                            }
                            placeholder={nl ? "Wat zegt de acteur bij deze stap?" : fr ? "Que dit l'acteur à cette étape ?" : "What does the actor say at this step?"}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => generateTTS(step.id)}
                            disabled={generatingTTS === step.id || !step.mascotMessage.trim()}
                            title={nl ? "Genereer spraak" : fr ? "Générer la voix" : "Generate speech"}
                          >
                            {generatingTTS === step.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                          {step.audioUrl && (
                            <Button
                              variant={playingAudio === step.id ? "default" : "outline"}
                              size="icon"
                              onClick={() => playAudio(step.id, step.audioUrl!)}
                              title={nl ? "Speel audio af" : fr ? "Lire l'audio" : "Play audio"}
                            >
                              {playingAudio === step.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        {step.audioUrl && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            {nl ? "✓ Spraak gegenereerd" : fr ? "✓ Voix générée" : "✓ Speech generated"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          {nl ? "Inhoud" : fr ? "Contenu" : "Content"}
                        </label>
                        <Textarea
                          value={step.content}
                          onChange={(e) => updateStep(step.id, "content", e.target.value)}
                          placeholder={nl ? "Beschrijf wat de gebruiker moet doen in deze stap..." : fr ? "Décrivez ce que l'utilisateur doit faire à cette étape..." : "Describe what the user should do in this step..."}
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(step.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add step button */}
          <Button
            variant="outline"
            onClick={addStep}
            className="w-full mt-6 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            {nl ? "Stap Toevoegen" : fr ? "Ajouter une étape" : "Add Step"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TutorialCreator;