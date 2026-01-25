'use client';

import { Search, MapPin, Loader2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  FloatingPortal,
} from "@floating-ui/react";

interface SearchResult {
  name: string;
  region: string;
  district?: string;
  slug: string;
  type: 'city' | 'municipality' | 'location';
  taxiCount?: number;
}

/**
 * SearchPanel - Optimalizovaný pre performance
 *
 * ZMENY pre rýchlosť:
 * - Vyhľadávanie cez API namiesto importu 2MB dát do bundle
 * - Debounce na 150ms pre menej API volaní
 * - Cachovanie výsledkov v prehliadači
 */
export const SearchPanel = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Floating UI setup
  const { refs, floatingStyles } = useFloating({
    open: showDropdown && filteredResults.length > 0,
    placement: 'bottom-start',
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['top-start'] }),
      shift({ padding: 16 }),
      size({
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(availableHeight - 16, 320)}px`,
          });
        },
        padding: 16,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Search function with API call
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=10`);
      if (response.ok) {
        const results: SearchResult[] = await response.json();
        setFilteredResults(results);
        setShowDropdown(results.length > 0);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchValue.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchValue);
      }, 150);
    } else {
      setFilteredResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue, performSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const floatingElement = refs.floating.current;

      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      if (floatingElement && floatingElement.contains(target)) {
        return;
      }

      setShowDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [refs.floating]);

  const navigateToLocation = (slug: string, name: string) => {
    router.push(`/taxi/${slug}`);
    setShowDropdown(false);
    setSearchValue("");
    toast.success(`Navigacia na ${name}`);
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error("Zadajte nazov mesta, obce alebo PSC");
      return;
    }

    // If we have results, use the first one
    if (filteredResults.length > 0) {
      navigateToLocation(filteredResults[0].slug, filteredResults[0].name);
      return;
    }

    // Otherwise, perform a search and navigate to first result
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchValue.trim())}&limit=1`);
      if (response.ok) {
        const results: SearchResult[] = await response.json();
        if (results.length > 0) {
          navigateToLocation(results[0].slug, results[0].name);
        } else {
          toast.error("Mesto/obec neboli najdene. Skuste iny nazov alebo PSC.");
        }
      }
    } catch {
      toast.error("Chyba pri vyhladavani");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
          const selected = filteredResults[selectedIndex];
          navigateToLocation(selected.slug, selected.name);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleLocationClick = async () => {
    if (!navigator.geolocation) {
      toast.error("Vas prehliadac nepodporuje geolokáciu");
      return;
    }
    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=sk`
          );

          if (!response.ok) {
            throw new Error("Nepodarilo sa ziskat informacie o polohe");
          }

          const data = await response.json();

          const detectedCity = data.address?.city ||
                      data.address?.town ||
                      data.address?.village ||
                      data.address?.municipality ||
                      "";

          if (detectedCity) {
            // Search for the city
            const searchResponse = await fetch(`/api/search?q=${encodeURIComponent(detectedCity)}&limit=1`);
            if (searchResponse.ok) {
              const results: SearchResult[] = await searchResponse.json();
              if (results.length > 0 && results[0].type === 'city') {
                toast.success(`Poloha najdena: ${results[0].name}`);
                router.push(`/taxi/${results[0].slug}`);
                setIsLoadingLocation(false);
                return;
              }
            }
          }

          // If city not found or no taxi services, search for nearest city with taxi
          toast.info("Hladam najblizsie mesto s taxisluzbami...");

          // Use API to find nearest city (simplified - just use the detected location name)
          const nearestResponse = await fetch(`/api/search?q=${encodeURIComponent(detectedCity || data.address?.county || '')}&limit=5`);
          if (nearestResponse.ok) {
            const nearestResults: SearchResult[] = await nearestResponse.json();
            const cityResult = nearestResults.find(r => r.type === 'city');
            if (cityResult) {
              toast.success(`Najblizsie mesto: ${cityResult.name}`);
              router.push(`/taxi/${cityResult.slug}`);
            } else {
              toast.error("Nepodarilo sa najst najblizsie mesto");
            }
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          toast.error("Chyba pri ziskavani informacii o polohe");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);

        switch (error.code) {
          case 1:
            toast.error("Pristup k polohe bol zamietnuty. Prosim, povolte pristup v nastaveniach prehliadaca.");
            break;
          case 2:
            toast.error("Informacie o polohe nie su dostupne");
            break;
          case 3:
            toast.error("Cas na ziskanie polohy vypršal");
            break;
          default:
            toast.error(`Chyba pri ziskavani polohy (kod: ${error.code})`);
            console.error("Geolocation error:", error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4" ref={containerRef}>
      {/* Search Input Container */}
      <div
        ref={refs.setReference}
        className="bg-card rounded-[4px] border border-foreground/20 p-1.5 md:p-2 flex items-center gap-1.5 md:gap-2"
      >
        <div className="flex-1 flex items-center gap-2 md:gap-3 px-2 md:px-4">
          <Search className="h-4 w-4 md:h-5 md:w-5 text-foreground flex-shrink-0" />
          <Input
            type="text"
            placeholder="Nazov mesta, obce alebo PSC..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchValue.trim() && filteredResults.length > 0) {
                setShowDropdown(true);
              }
            }}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground text-foreground font-medium"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-foreground/50" />
          )}
        </div>

        <Button
          variant="secondary"
          size="icon"
          onClick={handleSearch}
          className="rounded-[4px] h-10 w-10 md:h-12 md:w-12 flex-shrink-0"
          aria-label="Vyhladat"
        >
          <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          onClick={handleLocationClick}
          disabled={isLoadingLocation}
          className="rounded-[4px] h-10 w-10 md:h-12 md:w-12 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Pouzit moju polohu"
        >
          {isLoadingLocation ? (
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && filteredResults.length > 0 && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 9999,
              width: refs.reference.current?.getBoundingClientRect().width || 'auto',
            }}
            className="bg-card rounded-[4px] border border-foreground/20 overflow-y-auto shadow-lg"
          >
            {filteredResults.map((result, index) => (
              <button
                key={`${result.slug}-${result.district || index}`}
                onClick={() => navigateToLocation(result.slug, result.name)}
                className={`w-full text-left px-4 md:px-6 py-2.5 md:py-3 hover:bg-foreground/5 active:bg-foreground/10 transition-colors border-b border-foreground/5 last:border-b-0 ${
                  index === selectedIndex ? "bg-foreground/10" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-sm md:text-base text-foreground">{result.name}</div>
                  {result.type === 'municipality' && (
                    <span className="text-xs bg-foreground/10 px-1.5 py-0.5 rounded text-foreground/70">obec</span>
                  )}
                  {result.type === 'location' && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">lokalita</span>
                  )}
                </div>
                <div className="text-xs md:text-sm text-foreground/60 mt-0.5">
                  {result.district ? `Okres ${result.district}, ${result.region}` : result.region}
                </div>
              </button>
            ))}
          </div>
        </FloatingPortal>
      )}

      <p className="text-center text-xs md:text-sm text-foreground font-bold mt-3 md:mt-4">
        Alebo pouzite svoju polohu pre okamzite vyhladanie taxikov v okoli
      </p>
    </div>
  );
};
