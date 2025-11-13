import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactFormModal = ({ isOpen, onClose }: ContactFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Použitie FormSubmit.co služby - email sa odošle na info@taxinearme.sk
      const response = await fetch("https://formsubmit.co/info@taxinearme.sk", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setSubmitStatus("success");
        form.reset();
        setTimeout(() => {
          onClose();
          setSubmitStatus("idle");
        }, 2000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Niečo tu chýba?</DialogTitle>
          <DialogDescription className="text-base">
            Pomôžte nám zlepšiť našu databázu. Pošlite nám informácie o chýbajúcej taxislužbe alebo opravte existujúce údaje.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Skryté polia pre FormSubmit.co konfiguráciu */}
          <input type="hidden" name="_subject" value="Nový príspevok z Taxi NearMe - Niečo tu chýba" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="table" />

          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold">
              Vaše meno
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ján Novák"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold">
              Váš email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jan.novak@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="font-bold">
              Mesto
            </Label>
            <Input
              id="city"
              name="city"
              type="text"
              placeholder="napr. Bratislava"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxiName" className="font-bold">
              Názov taxislužby
            </Label>
            <Input
              id="taxiName"
              name="taxiName"
              type="text"
              placeholder="napr. Taxi Express"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="font-bold">
              Správa / Údaje na doplnenie
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Prosím uveďte telefónne číslo, web stránku alebo iné relevantné informácie..."
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          {submitStatus === "success" && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg font-medium">
              ✓ Ďakujeme! Váš príspevok bol úspešne odoslaný.
            </div>
          )}

          {submitStatus === "error" && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg font-medium">
              ✗ Nastala chyba pri odosielaní. Skúste to prosím znova.
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 font-bold"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 font-bold shadow-3d-sm hover:shadow-3d-md transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Odosielam...
                </>
              ) : (
                "Odoslať"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
