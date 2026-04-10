'use client';

/**
 * Reaktívne preview komponenty pre free-tier profily.
 * Čítajú draftData z InlineEditorProvider — keď user zmení pole v editore,
 * tieto komponenty sa prerenderujú s novými hodnotami.
 *
 * Používajú try/catch na useInlineEditor pretože ten istý pageContent JSX
 * sa renderuje aj BEZ PartnerPageWrapper (pre bežných návštevníkov).
 */

import { Phone, Globe } from 'lucide-react';
import { useInlineEditor } from './inline-editor/InlineEditorProvider';

export function FreePreviewPhone({ phone }: { phone: string | null | undefined }) {
  let displayPhone = phone;
  try {
    const editor = useInlineEditor();
    if (editor.draftData.phone) displayPhone = editor.draftData.phone as string;
  } catch {
    // Outside editor context — use static value
  }

  if (!displayPhone) return null;

  return (
    <a
      href={`tel:${displayPhone.replace(/\s/g, '')}`}
      className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg text-lg"
    >
      <Phone className="h-6 w-6" />
      <span>Zavolať {displayPhone}</span>
    </a>
  );
}

export function FreePreviewWebsite({ website }: { website: string | null | undefined }) {
  let displayWebsite = website;
  try {
    const editor = useInlineEditor();
    if (editor.draftData.website) displayWebsite = editor.draftData.website as string;
  } catch {
    // Outside editor context
  }

  if (!displayWebsite) return null;

  return (
    <a
      href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full mt-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
    >
      <Globe className="h-5 w-5" />
      <span>Navštíviť web</span>
    </a>
  );
}

export function FreePreviewDescription({
  customDescription,
  seoIntro,
  seoDisclaimer,
}: {
  customDescription: string | null | undefined;
  seoIntro: string;
  seoDisclaimer: string;
}) {
  let description = customDescription;
  let showDescription = true;

  try {
    const editor = useInlineEditor();
    if (editor.draftData.description !== undefined) {
      description = editor.draftData.description as string;
    }
    if (editor.draftData.show_description !== undefined) {
      showDescription = editor.draftData.show_description as boolean;
    }
  } catch {
    // Outside editor context — use static values
  }

  if (!showDescription) return null;

  return (
    <section className="py-6 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            O taxislužbe
          </h2>
          {description ? (
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {description}
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{seoIntro}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{seoDisclaimer}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
