import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-4xl px-8 py-24">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na hlavnú stránku
          </Button>
        </Link>

        <h1 className="text-5xl md:text-6xl font-black mb-12 text-foreground">
          Kontakt
        </h1>

        <div className="space-y-8">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-3d-lg border-2 border-foreground/10">
            <div className="flex items-start gap-6">
              <div className="bg-foreground text-background rounded-full p-4 shadow-3d-sm">
                <Mail className="h-8 w-8" />
              </div>

              <div className="flex-1 space-y-6">
                <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                  Ak máte otázky, podnety, sťažnosti, požiadavky na zmenu alebo návrhy na spoluprácu, napíšte nám na
                </p>

                <a
                  href="mailto:info@taxinearme.sk"
                  className="inline-flex items-center text-2xl md:text-3xl font-bold text-foreground hover:text-foreground/70 transition-colors"
                >
                  info@taxinearme.sk
                </a>

                <p className="text-lg text-foreground/80 leading-relaxed pt-4 border-t border-foreground/10">
                  Odpovieme vám čo najskôr.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Link to="/">
          <Button className="mt-12" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na hlavnú stránku
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-foreground py-12 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-foreground font-bold">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              <Link to="/ochrana-sukromia" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
                Ochrana súkromia
              </Link>
              <Link to="/podmienky-pouzivania" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
                Podmienky používania
              </Link>
              <Link to="/kontakt" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
