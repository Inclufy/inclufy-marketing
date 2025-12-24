import mascotImage from "@/assets/projextpal-mascot.png";
import { MessageCircle, Target, TrendingUp, Users } from "lucide-react";

export const MascotIntro = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Waarom <span className="text-gradient">Pax</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Pax is niet zomaar een mascotte – het is de belichaming van alles waar ProjeXtPal voor staat. 
              Een vriendelijke, slimme AI-assistent die jouw projecten naar een hoger niveau tilt.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <FeatureCard
                icon={<MessageCircle className="w-5 h-5" />}
                title="Altijd Beschikbaar"
                description="24/7 ondersteuning voor al je projectvragen"
              />
              <FeatureCard
                icon={<Target className="w-5 h-5" />}
                title="Doelgericht"
                description="Focus op wat écht belangrijk is voor jouw succes"
              />
              <FeatureCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Data-Gedreven"
                description="Slimme inzichten gebaseerd op jouw projectdata"
              />
              <FeatureCard
                icon={<Users className="w-5 h-5" />}
                title="Teamspeler"
                description="Verbetert samenwerking en communicatie"
              />
            </div>
          </div>

          {/* Right: Mascot showcase */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-110" />
              
              {/* Speech bubble */}
              <div className="absolute -top-4 -right-4 md:top-0 md:right-0 bg-card rounded-2xl p-4 shadow-lg border border-border max-w-[200px] z-10">
                <p className="text-sm font-medium text-foreground">
                  "Hoi! Ik ben Pax, jouw AI project buddy! 👋"
                </p>
                <div className="absolute bottom-0 left-8 w-4 h-4 bg-card border-b border-r border-border transform rotate-45 translate-y-2" />
              </div>

              <img
                src={mascotImage}
                alt="Pax - ProjeXtPal Mascot"
                className="relative w-72 h-72 md:w-96 md:h-96 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="group p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      {icon}
    </div>
    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);
