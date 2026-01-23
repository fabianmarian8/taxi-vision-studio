import { CheckCircle } from 'lucide-react';

export default function TaxiPlatbaSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Ikona */}
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        {/* Nadpis */}
        <h1 className="text-2xl font-bold text-foreground">
          Ďakujeme za platbu!
        </h1>

        {/* Popis */}
        <p className="text-muted-foreground">
          Potvrdenie príde na váš email.
        </p>
      </div>
    </div>
  );
}
