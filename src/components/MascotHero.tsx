import mascotImage from "@/assets/projextpal-mascot.png";
import { Sparkle } from "./Sparkle";
import { FloatingCard } from "./FloatingCard";
import { CheckCircle2, Zap, Brain, Calendar } from "lucide-react";

export const MascotHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-background" />
      
      {/* Floating sparkles */}
      <Sparkle className="absolute top-20 left-[15%]" size="lg" color="magenta" />
      <Sparkle className="absolute top-40 right-[20%]" size="md" color="purple" />
      <Sparkle className="absolute bottom-32 left-[25%]" size="sm" color="orange" />
      <Sparkle className="absolute top-1/3 right-[10%]" size="lg" color="green" />
      <Sparkle className="absolute bottom-40 right-[30%]" size="md" color="magenta" />

      {/* Floating UI cards */}
      <FloatingCard className="absolute top-32 left-8 md:left-20 hidden md:flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-projextpal-green/20 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-projextpal-green" />
        </div>
        <span className="text-sm font-medium text-foreground">Sprint voltooid!</span>
      </FloatingCard>

      <FloatingCard className="absolute bottom-40 left-12 md:left-32 hidden md:flex items-center gap-2" delayed>
        <div className="w-8 h-8 rounded-lg bg-projextpal-orange/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-projextpal-orange" />
        </div>
        <span className="text-sm font-medium text-foreground">AI Suggestie</span>
      </FloatingCard>

      <FloatingCard className="absolute top-48 right-8 md:right-24 hidden md:flex items-center gap-2" delayed>
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">AI Analyse</span>
      </FloatingCard>

      <FloatingCard className="absolute bottom-52 right-16 md:right-40 hidden md:flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-projextpal-purple/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-projextpal-purple" />
        </div>
        <span className="text-sm font-medium text-foreground">Planning klaar</span>
      </FloatingCard>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-primary/20 mb-8 animate-fade-in">
            <Sparkle size="sm" color="magenta" />
            <span className="text-sm font-medium text-primary">Maak kennis met Pax</span>
          </div>

          {/* Mascot image */}
          <div className="relative mb-8 animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-75" />
            <img
              src={mascotImage}
              alt="Pax - ProjeXtPal AI Mascot"
              className="relative w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl animate-bounce-gentle"
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            Dit is <span className="text-gradient">Pax</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            Jouw AI-aangedreven projectmanager die altijd klaarstaat. 
            Pax helpt je met slimme inzichten, automatische planning en real-time updates.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <FeatureBadge icon={<Brain className="w-4 h-4" />} text="AI Inzichten" />
            <FeatureBadge icon={<Calendar className="w-4 h-4" />} text="Slimme Planning" />
            <FeatureBadge icon={<Zap className="w-4 h-4" />} text="Automatisering" />
            <FeatureBadge icon={<CheckCircle2 className="w-4 h-4" />} text="Taakbeheer" />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureBadge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
    <span className="text-primary">{icon}</span>
    <span className="text-sm font-medium text-foreground">{text}</span>
  </div>
);
