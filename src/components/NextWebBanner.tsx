'use client';

export const NextWebBanner = () => {
  return (
    <section className="py-3 px-4 md:px-8">
      <div className="container mx-auto max-w-4xl">
        <a
          href="https://nextwebstudio.sk?ref=taxinearme"
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="relative overflow-hidden rounded-xl bg-[#0a0a0b] border border-[#27272a] px-4 py-3 md:p-5 transition-all duration-300 hover:border-[#c8ff00]/30">
            <div className="flex items-center gap-3 md:gap-5">
              {/* Logo - menšie na mobile */}
              <div className="flex-shrink-0">
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg bg-[#c8ff00] flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-7 md:h-7" viewBox="0 0 36 36" fill="none">
                    <path d="M8 26V10L16.5 26V10" stroke="#0a0a0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.5 12L25.5 18L19.5 24" stroke="#0a0a0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Text - kompaktný */}
              <div className="flex-1 min-w-0">
                <p className="text-[#a1a1aa] text-xs md:text-sm leading-snug">
                  <span className="text-white font-medium">Moderný web pre Vašu firmu</span>
                  <span className="hidden sm:inline"> — do 5 dní, platíte až keď ste spokojní</span>
                </p>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 bg-[#c8ff00] text-[#0a0a0b] px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold group-hover:bg-[#b8e600] transition-colors whitespace-nowrap">
                  Chcem web
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </span>
              </div>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
};
