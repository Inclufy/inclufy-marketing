import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Play, Pause, Download, Mic, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MascotSpeakerProps {
  mascotImage: string | null;
  mascotName?: string;
}

type Language = "nl" | "en";
type Voice = "male" | "female";
type ScriptCategory = "onboarding" | "errors" | "instructions" | "general" | "custom";
type Environment = "none" | "office" | "construction" | "manufacturing" | "warehouse" | "meeting" | "abstract";

const environments: { id: Environment; label: string; nlLabel: string; bgStyle: string; description: string }[] = [
  { id: "none", label: "None", nlLabel: "Geen", bgStyle: "bg-gradient-to-br from-white to-gray-100", description: "Plain background" },
  { id: "office", label: "Office", nlLabel: "Kantoor", bgStyle: "bg-gradient-to-br from-blue-50 via-white to-blue-100", description: "Modern office" },
  { id: "construction", label: "Construction", nlLabel: "Bouw", bgStyle: "bg-gradient-to-br from-orange-100 via-yellow-50 to-amber-100", description: "Construction site" },
  { id: "manufacturing", label: "Manufacturing", nlLabel: "Productie", bgStyle: "bg-gradient-to-br from-slate-100 via-gray-50 to-zinc-100", description: "Factory floor" },
  { id: "warehouse", label: "Warehouse", nlLabel: "Magazijn", bgStyle: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100", description: "Warehouse" },
  { id: "meeting", label: "Meeting Room", nlLabel: "Vergaderruimte", bgStyle: "bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50", description: "Conference room" },
  { id: "abstract", label: "Abstract", nlLabel: "Abstract", bgStyle: "bg-gradient-to-br from-primary/20 via-pink-100 to-purple-100", description: "Abstract shapes" },
];

const presetScripts = {
  nl: {
    onboarding: [
      { id: "welcome-new", label: "Welkom nieuwe gebruiker", text: "Hallo en welkom! Ik ben Pax, jouw digitale assistent. Ik help je graag op weg in ons systeem. Laten we samen de belangrijkste functies doorlopen." },
      { id: "first-steps", label: "Eerste stappen", text: "Geweldig dat je er bent! Laten we beginnen met de basis. Klik op de knoppen om door de tutorial te navigeren. Ik begeleid je bij elke stap." },
      { id: "profile-setup", label: "Profiel instellen", text: "Laten we eerst je profiel instellen. Vul je gegevens in en upload een foto. Dit helpt je collega's om je te herkennen." },
      { id: "tour-complete", label: "Rondleiding voltooid", text: "Fantastisch! Je hebt de rondleiding afgerond. Je bent nu klaar om aan de slag te gaan. Heb je vragen? Ik sta altijd voor je klaar!" },
    ],
    errors: [
      { id: "connection-error", label: "Verbindingsfout", text: "Oeps! Er lijkt een verbindingsprobleem te zijn. Controleer je internetverbinding en probeer het opnieuw." },
      { id: "save-error", label: "Opslagfout", text: "Het opslaan is helaas niet gelukt. Geen zorgen, je werk is veilig. Probeer het over een paar seconden opnieuw." },
      { id: "permission-denied", label: "Geen toegang", text: "Je hebt geen toegang tot deze functie. Neem contact op met je beheerder om de juiste rechten aan te vragen." },
      { id: "session-expired", label: "Sessie verlopen", text: "Je sessie is verlopen voor je veiligheid. Log opnieuw in om door te gaan met je werk." },
      { id: "file-too-large", label: "Bestand te groot", text: "Dit bestand is te groot om te uploaden. Probeer het bestand te verkleinen of kies een ander bestand." },
    ],
    instructions: [
      { id: "how-to-create", label: "Project aanmaken", text: "Om een nieuw project aan te maken, klik je op de plus-knop rechtsboven. Vul de projectnaam in en kies een categorie. Zo simpel is het!" },
      { id: "add-team", label: "Team toevoegen", text: "Wil je collega's uitnodigen? Ga naar teaminstellingen en voer hun e-mailadres in. Ze ontvangen automatisch een uitnodiging." },
      { id: "set-deadline", label: "Deadline instellen", text: "Klik op de taak en selecteer een deadline. Ik stuur automatisch herinneringen als de deadline nadert." },
      { id: "export-report", label: "Rapport exporteren", text: "Je kunt een rapport exporteren door naar Analytics te gaan en op de export-knop te klikken. Kies je gewenste formaat en download het bestand." },
      { id: "safety-instructions", label: "Veiligheidsinstructies", text: "Veiligheid staat voorop! Draag altijd je persoonlijke beschermingsmiddelen en volg de aangewezen routes. Bij twijfel, vraag je leidinggevende." },
    ],
    general: [
      { id: "welcome", label: "Welkom", text: "Hallo! Welkom bij ProjeXtPal. Ik ben Pax, jouw persoonlijke projectassistent. Hoe kan ik je vandaag helpen?" },
      { id: "intro", label: "Introductie", text: "Ik ben Pax, de slimme AI-mascotte van ProjeXtPal. Samen maken we projectmanagement eenvoudig en leuk!" },
      { id: "help", label: "Hulp aanbieden", text: "Heb je hulp nodig met je project? Ik sta altijd klaar om je te ondersteunen met planning, taken en deadlines." },
      { id: "success", label: "Succes vieren", text: "Geweldig gedaan! Je project is succesvol afgerond. Tijd om te vieren!" },
      { id: "goodbye", label: "Tot ziens", text: "Bedankt voor je bezoek! Tot de volgende keer. Vergeet niet: samen krijgen we elk project voor elkaar!" },
    ],
  },
  en: {
    onboarding: [
      { id: "welcome-new", label: "Welcome new user", text: "Hello and welcome! I'm Pax, your digital assistant. I'm happy to help you get started with our system. Let's walk through the key features together." },
      { id: "first-steps", label: "First steps", text: "Great to have you here! Let's start with the basics. Click the buttons to navigate through the tutorial. I'll guide you at every step." },
      { id: "profile-setup", label: "Profile setup", text: "Let's set up your profile first. Fill in your details and upload a photo. This helps your colleagues recognize you." },
      { id: "tour-complete", label: "Tour completed", text: "Fantastic! You've completed the tour. You're now ready to get started. Have questions? I'm always here for you!" },
    ],
    errors: [
      { id: "connection-error", label: "Connection error", text: "Oops! There seems to be a connection problem. Check your internet connection and try again." },
      { id: "save-error", label: "Save error", text: "Unfortunately, saving failed. Don't worry, your work is safe. Please try again in a few seconds." },
      { id: "permission-denied", label: "Access denied", text: "You don't have access to this feature. Contact your administrator to request the proper permissions." },
      { id: "session-expired", label: "Session expired", text: "Your session has expired for your security. Please log in again to continue your work." },
      { id: "file-too-large", label: "File too large", text: "This file is too large to upload. Try reducing the file size or choose a different file." },
    ],
    instructions: [
      { id: "how-to-create", label: "Create project", text: "To create a new project, click the plus button in the top right. Enter the project name and choose a category. It's that simple!" },
      { id: "add-team", label: "Add team", text: "Want to invite colleagues? Go to team settings and enter their email address. They'll automatically receive an invitation." },
      { id: "set-deadline", label: "Set deadline", text: "Click on the task and select a deadline. I'll automatically send reminders as the deadline approaches." },
      { id: "export-report", label: "Export report", text: "You can export a report by going to Analytics and clicking the export button. Choose your preferred format and download the file." },
      { id: "safety-instructions", label: "Safety instructions", text: "Safety first! Always wear your personal protective equipment and follow the designated routes. When in doubt, ask your supervisor." },
    ],
    general: [
      { id: "welcome", label: "Welcome", text: "Hello! Welcome to ProjeXtPal. I'm Pax, your personal project assistant. How can I help you today?" },
      { id: "intro", label: "Introduction", text: "I'm Pax, the smart AI mascot of ProjeXtPal. Together we make project management simple and fun!" },
      { id: "help", label: "Offer help", text: "Need help with your project? I'm always here to support you with planning, tasks and deadlines." },
      { id: "success", label: "Celebrate", text: "Great job! Your project has been completed successfully. Time to celebrate!" },
      { id: "goodbye", label: "Goodbye", text: "Thanks for visiting! See you next time. Remember: together we can accomplish any project!" },
    ],
  },
};

const categoryLabels = {
  nl: {
    onboarding: "🚀 Onboarding",
    errors: "⚠️ Foutmeldingen",
    instructions: "📋 Instructies",
    general: "💬 Algemeen",
    custom: "✏️ Eigen tekst",
  },
  en: {
    onboarding: "🚀 Onboarding",
    errors: "⚠️ Error Messages",
    instructions: "📋 Instructions",
    general: "💬 General",
    custom: "✏️ Custom",
  },
};

export const MascotSpeaker = ({ mascotImage, mascotName = "Pax" }: MascotSpeakerProps) => {
  const [language, setLanguage] = useState<Language>("nl");
  const [voice, setVoice] = useState<Voice>("female");
  const [category, setCategory] = useState<ScriptCategory>("general");
  const [script, setScript] = useState(presetScripts.nl.general[0].text);
  const [environment, setEnvironment] = useState<Environment>("none");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [lipsyncFrame, setLipsyncFrame] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const previewRafRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mascotImgRef = useRef<HTMLImageElement | null>(null);
  const isPlayingRef = useRef(false);

  // Keep a ref for immediate access inside rAF callbacks
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Update script when language or category changes
  useEffect(() => {
    if (category !== "custom" && presetScripts[language][category]) {
      setScript(presetScripts[language][category][0].text);
    }
  }, [language, category]);

  // Lipsync animation based on audio analysis
  const updateLipsync = useCallback(() => {
    // Don't rely on React state here (it may be stale right after setState)
    const isActuallyPlaying = !!audioRef.current && !audioRef.current.paused && !audioRef.current.ended;
    if (!analyserRef.current || !isPlayingRef.current || !isActuallyPlaying) {
      setLipsyncFrame(0);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume from lower bins (speech energy lives mostly here)
    const voiceRange = dataArray.slice(1, 32);
    const avgVolume = voiceRange.reduce((a, b) => a + b, 0) / voiceRange.length;

    // Map volume to mouth openness (0-5 frames)
    const mouthFrame = Math.min(5, Math.floor(avgVolume / 28));
    setLipsyncFrame(mouthFrame);

    animationFrameRef.current = requestAnimationFrame(updateLipsync);
  }, []);

  // Preload mascot image once (avoid creating a new Image every frame)
  useEffect(() => {
    if (!mascotImage) {
      mascotImgRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      mascotImgRef.current = img;
    };

    img.onerror = () => {
      mascotImgRef.current = null;
    };

    img.src = mascotImage;
  }, [mascotImage]);

  // Draw preview with lipsync (smooth rAF loop)
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const img = mascotImgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== 400) canvas.width = 400;
    if (canvas.height !== 400) canvas.height = 400;

    // Background
    const gradients: Record<Environment, string[]> = {
      none: ["#ffffff", "#f5f5f5"],
      office: ["#eff6ff", "#dbeafe", "#bfdbfe"],
      construction: ["#ffedd5", "#fed7aa", "#fdba74"],
      manufacturing: ["#f1f5f9", "#e2e8f0", "#cbd5e1"],
      warehouse: ["#fef3c7", "#fde68a", "#fcd34d"],
      meeting: ["#eef2ff", "#e0e7ff", "#c7d2fe"],
      abstract: ["#fce7f3", "#fbcfe8", "#f9a8d4"],
    };

    const colors = gradients[environment] ?? gradients.none;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    colors.forEach((c, i) => gradient.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mascot animation
    const time = Date.now() / 1000;
    const baseBreathe = 1 + Math.sin(time * 2) * 0.02;
    const baseBounce = Math.sin(time * 3) * 5;

    // When speaking, exaggerate motion a bit so it reads clearly
    const speakBoost = isPlayingRef.current ? 1.35 : 1;
    const breathe = 1 + (baseBreathe - 1) * speakBoost;
    const bounce = baseBounce * speakBoost;
    const tilt = (isPlayingRef.current ? Math.sin(time * 6) * 0.02 : 0);

    // Draw mascot and lipsync overlay in the SAME transform space
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + bounce);
    ctx.rotate(tilt);
    ctx.scale(breathe, breathe);

    ctx.drawImage(img, -150, -150, 300, 300);

    // Lipsync overlay (positioned relative to the mascot image)
    if (isPlayingRef.current && lipsyncFrame > 0) {
      const mouthOpen = lipsyncFrame; // 1..5
      const mouthHeight = mouthOpen * 4;

      // These coordinates are relative to the center of the drawn mascot image.
      // Tweak in one place if needed for a new mascot art style.
      const mouthX = 0;
      const mouthY = 55;

      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(mouthX, mouthY, 14 + mouthOpen * 2, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#8b0000";
      ctx.beginPath();
      ctx.ellipse(mouthX, mouthY + 2, 10 + mouthOpen, Math.max(1, mouthHeight - 3), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Speaking bars
    if (isPlayingRef.current) {
      const barCount = 5;
      const barWidth = 6;
      const maxHeight = 25;

      for (let i = 0; i < barCount; i++) {
        const height = Math.abs(Math.sin(time * 8 + i * 0.8)) * maxHeight * (0.5 + lipsyncFrame / 10);
        ctx.fillStyle = `hsl(330, 85%, ${50 + i * 5}%)`;
        ctx.fillRect(
          canvas.width / 2 - (barCount * barWidth) / 2 + i * (barWidth + 3),
          canvas.height - 40 - height / 2,
          barWidth,
          height
        );
      }
    }
  }, [environment, lipsyncFrame]);

  // Continuous render loop
  useEffect(() => {
    const tick = () => {
      drawPreview();
      previewRafRef.current = requestAnimationFrame(tick);
    };

    previewRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
    };
  }, [drawPreview]);

  const generateSpeech = async () => {
    if (!script.trim()) {
      toast.error(language === "nl" ? "Voer eerst een script in" : "Enter a script first");
      return;
    }

    setIsGenerating(true);
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
            language,
            voiceId: voice === "male" 
              ? (language === "nl" ? "onwK4e9ZLuTAKqWW03F9" : "JBFqnCBsd6RMkjVDRZzb")
              : "EXAVITQu4vr4xnSDxMaL"
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

      const audioDataUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      setAudioUrl(audioDataUrl);
      toast.success(language === "nl" ? "Spraak gegenereerd!" : "Speech generated!");
    } catch (err) {
      console.error("TTS error:", err);
      toast.error(language === "nl" ? "Kon spraak niet genereren" : "Could not generate speech");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = async () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    // Ensure the element isn't muted / volume at 0
    audioRef.current.muted = false;
    audioRef.current.volume = 1;

    // Setup audio analysis for lipsync
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    // A given HTMLMediaElement can only be connected to ONE MediaElementAudioSourceNode for its lifetime.
    if (!sourceRef.current) {
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Connect audio to output and to analyser in parallel
      sourceRef.current.connect(audioContextRef.current.destination);
      sourceRef.current.connect(analyserRef.current);
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    await audioRef.current.play();
    isPlayingRef.current = true;
    setIsPlaying(true);
    updateLipsync();
  };

  const handleAudioEnded = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setLipsyncFrame(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${mascotName.toLowerCase()}-speech-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(language === "nl" ? "Audio gedownload!" : "Audio downloaded!");
  };

  const startVideoRecording = useCallback(async () => {
    if (!canvasRef.current || !mascotImage || !audioUrl) {
      toast.error(language === "nl" ? "Genereer eerst spraak voor de mascotte" : "Generate speech for the mascot first");
      return;
    }

    setIsRecording(true);
    recordedChunksRef.current = [];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 720;
    canvas.height = 720;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mascotImage;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvasStream = canvas.captureStream(30);
    
    const audio = new Audio(audioUrl);
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioContext.destination);

    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destination.stream.getAudioTracks(),
    ]);

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `${mascotName.toLowerCase()}-video-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsRecording(false);
      toast.success(language === "nl" ? "Video geëxporteerd als WebM!" : "Video exported as WebM!");
    };

    let animationFrame = 0;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;

      // Get audio data for lipsync
      analyser.getByteFrequencyData(dataArray);
      const voiceRange = dataArray.slice(2, 20);
      const avgVolume = voiceRange.reduce((a, b) => a + b, 0) / voiceRange.length;
      const mouthFrame = Math.min(5, Math.floor(avgVolume / 40));

      // Draw environment background
      const env = environments.find(e => e.id === environment);
      if (env && environment !== "none") {
        const gradients: Record<Environment, string[]> = {
          none: ["#ffffff", "#f5f5f5"],
          office: ["#eff6ff", "#dbeafe", "#bfdbfe"],
          construction: ["#ffedd5", "#fed7aa", "#fdba74"],
          manufacturing: ["#f1f5f9", "#e2e8f0", "#cbd5e1"],
          warehouse: ["#fef3c7", "#fde68a", "#fcd34d"],
          meeting: ["#eef2ff", "#e0e7ff", "#c7d2fe"],
          abstract: ["#fce7f3", "#fbcfe8", "#f9a8d4"],
        };
        
        const colors = gradients[environment];
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        colors.forEach((color, i) => {
          gradient.addColorStop(i / (colors.length - 1), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw mascot with animation
      const scale = 1 + Math.sin(animationFrame * 0.1) * 0.02;
      const offsetY = Math.sin(animationFrame * 0.05) * 5;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -250, -250, 500, 500);
      ctx.restore();

      // Draw lipsync mouth
      if (mouthFrame > 0) {
        const mouthHeight = mouthFrame * 6;
        const mouthY = canvas.height / 2 + 70 + offsetY;
        
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = "#1a1a1a";
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, mouthY, 25 + mouthFrame * 3, mouthHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#8b0000";
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, mouthY + 3, 18 + mouthFrame * 2, mouthHeight - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw speaking indicator
      const barCount = 5;
      const barWidth = 10;
      const maxHeight = 40;
      
      for (let i = 0; i < barCount; i++) {
        const height = Math.abs(Math.sin(animationFrame * 0.2 + i * 0.5)) * maxHeight * (0.5 + mouthFrame / 10);
        ctx.fillStyle = `hsl(330, 85%, ${50 + i * 5}%)`;
        ctx.fillRect(
          canvas.width / 2 - (barCount * barWidth) / 2 + i * (barWidth + 5),
          canvas.height - 80 - height / 2,
          barWidth,
          height
        );
      }

      animationFrame++;
      requestAnimationFrame(animate);
    };

    mediaRecorder.start();
    audio.play();
    animate();

    audio.onended = () => {
      setTimeout(() => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
        }
        audioContext.close();
      }, 500);
    };
  }, [mascotImage, audioUrl, mascotName, environment, language]);

  const currentScripts = category !== "custom" ? presetScripts[language][category] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          {language === "nl" ? `Laat ${mascotName} spreken` : `Make ${mascotName} speak`}
        </h3>
      </div>

      {/* Preview Canvas */}
      {mascotImage && (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <canvas
            ref={previewCanvasRef}
            className="w-full aspect-square"
            style={{ maxHeight: "300px", objectFit: "contain" }}
          />
          {isPlaying && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary/90 text-primary-foreground text-xs rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {language === "nl" ? "Spreekt..." : "Speaking..."}
            </div>
          )}
        </div>
      )}

      {/* Language & Voice Selection */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            {language === "nl" ? "Taal" : "Language"}
          </label>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            {language === "nl" ? "Stem" : "Voice"}
          </label>
          <Select value={voice} onValueChange={(v) => setVoice(v as Voice)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">{language === "nl" ? "👩 Vrouw" : "👩 Female"}</SelectItem>
              <SelectItem value="male">{language === "nl" ? "👨 Man" : "👨 Male"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Environment Selection */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          {language === "nl" ? "Achtergrond omgeving" : "Background environment"}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {environments.map((env) => (
            <button
              key={env.id}
              onClick={() => setEnvironment(env.id)}
              className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                environment === env.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`w-8 h-8 rounded ${env.bgStyle}`} />
              <span className="text-[10px] font-medium">
                {language === "nl" ? env.nlLabel : env.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Script Category Tabs */}
      <Tabs value={category} onValueChange={(v) => setCategory(v as ScriptCategory)} className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-auto">
          {(Object.keys(categoryLabels[language]) as ScriptCategory[]).map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs py-2 px-1">
              {categoryLabels[language][cat]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Preset Scripts for each category */}
        {(["onboarding", "errors", "instructions", "general"] as const).map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {presetScripts[language][cat].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setScript(preset.text)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    script === preset.text
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="custom" className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">
            {language === "nl" 
              ? "Schrijf je eigen tekst die de mascotte moet uitspreken."
              : "Write your own text for the mascot to speak."}
          </p>
        </TabsContent>
      </Tabs>

      {/* Script Textarea */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Script</label>
        <Textarea
          value={script}
          onChange={(e) => {
            setScript(e.target.value);
            if (category !== "custom") setCategory("custom");
          }}
          placeholder={language === "nl" ? "Typ hier wat de mascotte moet zeggen..." : "Type what the mascot should say..."}
          className="min-h-[100px] resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {script.length} {language === "nl" ? "karakters" : "characters"}
        </p>
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateSpeech}
        disabled={isGenerating || !script.trim()}
        className="w-full gap-2"
      >
        <Mic className="w-4 h-4" />
        {isGenerating 
          ? (language === "nl" ? "Genereren..." : "Generating...") 
          : (language === "nl" ? "Genereer Spraak" : "Generate Speech")}
      </Button>

      {/* Audio Player */}
      {audioUrl && (
        <div className="p-4 bg-muted/50 rounded-xl space-y-3">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
            className="hidden"
          />
          
          <div className="flex gap-2">
            <Button
              onClick={togglePlayback}
              variant="outline"
              className="flex-1 gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying 
                ? (language === "nl" ? "Pauzeren" : "Pause") 
                : (language === "nl" ? "Afspelen" : "Play")}
            </Button>
            <Button
              onClick={downloadAudio}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              MP3
            </Button>
          </div>

          {/* Video Export */}
          {mascotImage && (
            <Button
              onClick={startVideoRecording}
              disabled={isRecording}
              variant="secondary"
              className="w-full gap-2"
            >
              <Download className="w-4 h-4" />
              {isRecording 
                ? (language === "nl" ? "Opnemen..." : "Recording...") 
                : (language === "nl" ? "Exporteer als Video (WebM)" : "Export as Video (WebM)")}
            </Button>
          )}
        </div>
      )}

      {/* Hidden canvas for video recording */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
