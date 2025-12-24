import { useState } from "react";
import { Check, Heart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import mascot1 from "@/assets/mascot-business-casual-1.png";
import mascot2 from "@/assets/mascot-business-casual-2.png";
import mascot3 from "@/assets/mascot-business-casual-3.png";
import mascot4 from "@/assets/mascot-business-casual-4.png";
import originalMascot from "@/assets/projextpal-mascot.png";
import femaleMascot1 from "@/assets/mascot-female-1.png";
import femaleMascot2 from "@/assets/mascot-female-2.png";
import femaleMascot3 from "@/assets/mascot-female-3.png";
import femaleMascot4 from "@/assets/mascot-female-4.png";
import darkSkin1 from "@/assets/mascot-dark-skin-1.png";
import darkSkin2 from "@/assets/mascot-dark-skin-2.png";
import tanSkin1 from "@/assets/mascot-tan-skin-1.png";
import tanSkin2 from "@/assets/mascot-tan-skin-2.png";
import asian1 from "@/assets/mascot-asian-1.png";
import asian2 from "@/assets/mascot-asian-2.png";

type MascotCategory = "all" | "pax" | "paxi" | "diverse";

const mascots = [
  // Original light skin
  { id: "original", image: originalMascot, name: "Pax Original", description: "De originele AI-assistent", category: "pax" as const },
  { id: "confident", image: mascot1, name: "Pax Confident", description: "Zelfverzekerd & professioneel", category: "pax" as const },
  { id: "tech", image: mascot2, name: "Pax Tech", description: "Tech-savvy met tablet", category: "pax" as const },
  { id: "thumbsup", image: mascot3, name: "Pax Cheerful", description: "Enthousiast & positief", category: "pax" as const },
  { id: "presenter", image: mascot4, name: "Pax Presenter", description: "Klaar om te presenteren", category: "pax" as const },
  // Female light skin
  { id: "fem-executive", image: femaleMascot1, name: "Paxi Executive", description: "Zelfverzekerde leider", category: "paxi" as const },
  { id: "fem-organizer", image: femaleMascot2, name: "Paxi Organizer", description: "Georganiseerd & slim", category: "paxi" as const },
  { id: "fem-friendly", image: femaleMascot3, name: "Paxi Friendly", description: "Vriendelijk & welkomend", category: "paxi" as const },
  { id: "fem-cheerful", image: femaleMascot4, name: "Paxi Cheerful", description: "Positief & enthousiast", category: "paxi" as const },
  // Diverse skin tones
  { id: "dark-male", image: darkSkin1, name: "Pax Bold", description: "Zelfverzekerd & sterk", category: "diverse" as const },
  { id: "dark-female", image: darkSkin2, name: "Paxi Bright", description: "Slim & georganiseerd", category: "diverse" as const },
  { id: "tan-male", image: tanSkin1, name: "Pax Wave", description: "Vriendelijk & welkomend", category: "diverse" as const },
  { id: "tan-female", image: tanSkin2, name: "Paxi Power", description: "Zelfverzekerd & stijlvol", category: "diverse" as const },
  { id: "asian-male", image: asian1, name: "Pax Smart", description: "Analytisch & innovatief", category: "diverse" as const },
  { id: "asian-female", image: asian2, name: "Paxi Pro", description: "Professioneel & efficiënt", category: "diverse" as const },
];

const filterTabs = [
  { id: "all" as const, label: "Alle", icon: "✨" },
  { id: "pax" as const, label: "Pax", icon: "👔" },
  { id: "paxi" as const, label: "Paxi", icon: "👩‍💼" },
  { id: "diverse" as const, label: "Divers", icon: "🌍" },
];

export const MascotGallery = () => {
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MascotCategory>("all");

  const filteredMascots = activeFilter === "all" 
    ? mascots 
    : mascots.filter(m => m.category === activeFilter);

  const selectedMascotData = mascots.find((m) => m.id === selectedMascot);

  const handleDownload = async () => {
    if (!selectedMascotData) return;
    
    try {
      const response = await fetch(selectedMascotData.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `projextpal-${selectedMascotData.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Kies jouw <span className="text-gradient">Pax</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Welke versie van Pax past het beste bij jouw team? Klik op je favoriet!
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                activeFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredMascots.map((mascot) => (
            <button
              key={mascot.id}
              onClick={() => setSelectedMascot(mascot.id)}
              className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 bg-card hover:shadow-xl ${
                selectedMascot === mascot.id
                  ? "border-primary shadow-lg shadow-primary/20 scale-105"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* Selection indicator */}
              {selectedMascot === mascot.id && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
                  <Heart className="w-4 h-4 text-primary-foreground fill-current" />
                </div>
              )}

              {/* Mascot image */}
              <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-muted/30">
                <img
                  src={mascot.image}
                  alt={mascot.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* Info */}
              <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">
                {mascot.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {mascot.description}
              </p>
            </button>
          ))}
        </div>

        {/* Selected mascot message with download */}
        {selectedMascot && selectedMascotData && (
          <div className="mt-12 text-center animate-fade-in">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-4 bg-primary/10 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">
                  Je hebt gekozen voor{" "}
                  <span className="text-primary">{selectedMascotData.name}</span>!
                </span>
              </div>
              <Button 
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download voor marketing
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
