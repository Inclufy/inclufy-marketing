import mascotImage from "@/assets/projextpal-mascot.png";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo and mascot */}
          <div className="flex items-center gap-4">
            <img
              src={mascotImage}
              alt="Pax"
              className="w-16 h-16 object-contain"
            />
            <div>
              <div className="flex items-center">
                <span className="text-xl font-bold text-background">Inclu</span>
                <span className="text-xl font-bold text-primary">fy</span>
                <span className="text-xl font-bold text-background"> Marketing</span>
              </div>
              <p className="text-sm text-background/60">Marketing voor Solutions, Consulting & Academy</p>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-sm text-background/60">
            © 2024 Inclufy Marketing. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  );
};
