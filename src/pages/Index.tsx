import { Header } from "@/components/Header";
import { MascotHero } from "@/components/MascotHero";
import { MascotIntro } from "@/components/MascotIntro";
import { MascotGallery } from "@/components/MascotGallery";
import { MascotCustomizer } from "@/components/MascotCustomizer";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <MascotHero />
        <MascotIntro />
        <MascotGallery />
        <MascotCustomizer />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
