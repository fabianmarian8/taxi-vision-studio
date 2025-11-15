import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Calendar, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ElektrifikaciaPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-24 pb-12 px-4 hero-3d-bg">
        <div className="container mx-auto max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />Späť
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"><Zap className="h-4 w-4 inline mr-1" />Elektrifikácia</span>
            <div className="text-sm text-foreground/60"><Calendar className="h-4 w-4 inline mr-1" />15. január 2025</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">Elektrifikácia taxislužby na Slovensku</h1>
          <p className="text-xl mb-6">Budúcnosť taxi je elektrická. Analýza trendu a výhod elektromobilov v taxislužbách.</p>
        </div>
      </section>
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <article className="prose prose-lg max-w-none">
            <h2>Prečo elektrifikácia?</h2>
            <p>Elektromobily prinášajú nižšie prevádzkové náklady, ekologickú prepravu a modernú image taxislužby.</p>
            <h2>Výhody pre vodičov</h2>
            <p>Nižšie náklady na palivo, menšia údržba, tichá jazda, moderná technológia.</p>
            <h2>Výzvy</h2>
            <p>Vyššia počiatočná investícia, dostupnosť nabíjacích staníc, dojazd vozidla.</p>
          </article>
          <div className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl text-center">
            <Link to="/komplexny-sprievodca-taxi"><Button size="lg">Zobraziť sprievodcu</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
};
export default ElektrifikaciaPage;
