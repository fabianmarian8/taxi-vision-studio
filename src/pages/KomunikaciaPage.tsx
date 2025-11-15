import { Header } from "@/components/Header";
import { GeometricLines } from "@/components/GeometricLines";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Calendar, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const KomunikaciaPage = () => {
  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Komunikácia medzi taxikárom a zákazníkom',
        url: window.location.href
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link skopírovaný do schránky');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-8 relative hero-3d-bg overflow-hidden">
        <GeometricLines variant="hero" count={12} />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Späť na hlavnú stránku
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
              <MessageCircle className="h-4 w-4 inline mr-1" />
              Komunikácia
            </span>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Calendar className="h-4 w-4" />
              15. január 2025
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground leading-tight">
            Ako vyzerá dobrá komunikácia medzi taxikárom a zákazníkom
          </h1>
          
          <p className="text-xl text-foreground/80 mb-6">
            Jasné pravidlá, slušnosť a hranice, ktoré by mali poznať obe strany.
          </p>

          <Button
            onClick={handleShare}
            variant="outline"
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Zdieľať článok
          </Button>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 md:px-8 bg-white">
        <div className="container mx-auto max-w-4xl">
          <article className="prose prose-lg max-w-none">
            
            <h2>Zlaté pravidlá dobrej komunikácie</h2>

            <p>Dobrá komunikácia medzi vodičom a zákazníkom je základom kvalitnej taxislužby. Poznáme 5 pilierov úspešnej jazdy.</p>

            <h3>1. Jasné zadanie od začiatku</h3>
            <p>Zákazník by mal hneď po nastúpení jasne povedať cieľ. Vodič by mal vedieť odhadnúť náladu zákazníka - niekto chce rozhovor, niekto ticho.</p>

            <h3>2. Rešpekt voči priestoru druhého</h3>
            <p>Ak pasažier je zahľadený do telefónu alebo pozerá von oknom, je to jasný odkaz pre ticho.</p>

            <h3>3. Profesionalita</h3>
            <p>Správanie vodiča závisí od toho, či dostane dobré hodnotenie a či bude mať aj naďalej zákazníkov.</p>

            <h2>Červené vlajky</h2>

            <p>Vodič má právo ukončiť jazdu, ak je zákazník agresívny alebo pod vplyvom alkoholu.</p>

            <h2>Slovenský právny rámec</h2>

            <p>Vodič má povinnosť prepraviť cestujúcich po najkratšej trase a vydať potvrdenie o preprave.</p>

          </article>

          <div className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <h3 className="text-2xl font-bold mb-4 text-center">Chcete vidieť komplexný sprievodca?</h3>
            <div className="flex justify-center">
              <Link to="/komplexny-sprievodca-taxi">
                <Button size="lg">Zobraziť sprievodcu</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KomunikaciaPage;
