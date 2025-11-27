'use client';

import { Search, MapPin, Loader2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { findNearestCity } from "@/lib/locationUtils";
import { slovakCities } from "@/data/cities";
import { allMunicipalities } from "@/data/municipalities";
import { looksLikePostalCode, findByPostalCode, normalizePostalCode } from "@/data/postal-codes";

/**
 * Normalizuje text - odstráni diakritiku a prevedie na malé písmená
 * Napr. "Košice" -> "kosice", "Žilina" -> "zilina"
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export const SearchPanel = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredResults, setFilteredResults] = useState<Array<{ name: string; region: string; slug: string; type: 'city' | 'municipality' }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Filter cities AND municipalities based on search input (supports PSČ)
  useEffect(() => {
    if (searchValue.trim()) {
      const trimmedSearch = searchValue.trim();

      // Check if searching by postal code (PSČ)
      if (looksLikePostalCode(trimmedSearch)) {
        const pscResult = findByPostalCode(trimmedSearch);
        if (pscResult) {
          // Found city by PSČ
          const normalizedPsc = normalizePostalCode(trimmedSearch) || trimmedSearch;
          setFilteredResults([{
            name: pscResult.name,
            region: `PSČ ${normalizedPsc}${pscResult.district ? ` (${pscResult.district})` : ''}`,
            slug: pscResult.slug,
            type: 'city' as const
          }]);
          setShowDropdown(true);
          setSelectedIndex(-1);
          return;
        }
      }

      const normalizedSearch = normalizeText(trimmedSearch);

      // Search in cities (with taxi services) - supports search without diacritics
      const filteredCities = slovakCities
        .filter((city) => normalizeText(city.name).includes(normalizedSearch))
        .map((city) => ({ name: city.name, region: city.region, slug: city.slug, type: 'city' as const }));

      // Search in municipalities (without taxi services in our DB)
      const filteredMunicipalities = allMunicipalities
        .filter((mun) => normalizeText(mun.name).includes(normalizedSearch))
        .filter((mun) => !slovakCities.some(city => city.slug === mun.slug)) // Exclude duplicates
        .map((mun) => ({ name: mun.name, region: mun.region, slug: mun.slug, type: 'municipality' as const }));

      // Combine: cities first, then municipalities
      const combined = [...filteredCities, ...filteredMunicipalities];
      setFilteredResults(combined);
      setShowDropdown(combined.length > 0);
      setSelectedIndex(-1);
    } else {
      setFilteredResults([]);
      setShowDropdown(false);
    }
  }, [searchValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateToLocation = (slug: string, name: string) => {
    router.push(`/taxi/${slug}`);
    setShowDropdown(false);
    setSearchValue("");
    toast.success(`Navigácia na ${name}`);
  };

  const handleSearch = () => {
    if (!searchValue.trim()) {
      toast.error("Zadajte názov mesta, obce alebo PSČ");
      return;
    }

    const trimmedSearch = searchValue.trim();

    // Check if searching by postal code (PSČ)
    if (looksLikePostalCode(trimmedSearch)) {
      const pscResult = findByPostalCode(trimmedSearch);
      if (pscResult) {
        navigateToLocation(pscResult.slug, pscResult.name);
        toast.success(`Nájdené podľa PSČ: ${pscResult.name}`);
        return;
      } else {
        toast.error("PSČ nebolo nájdené v databáze. Skúste zadať názov mesta.");
        return;
      }
    }

    const normalizedSearch = normalizeText(trimmedSearch);

    // Try exact match first in cities (supports search without diacritics)
    const exactCityMatch = slovakCities.find(
      (city) => normalizeText(city.name) === normalizedSearch
    );

    if (exactCityMatch) {
      navigateToLocation(exactCityMatch.slug, exactCityMatch.name);
      return;
    }

    // Try exact match in municipalities
    const exactMunMatch = allMunicipalities.find(
      (mun) => normalizeText(mun.name) === normalizedSearch
    );

    if (exactMunMatch) {
      navigateToLocation(exactMunMatch.slug, exactMunMatch.name);
      return;
    }

    // Use first filtered result
    if (filteredResults.length > 0) {
      navigateToLocation(filteredResults[0].slug, filteredResults[0].name);
    } else {
      toast.error("Mesto/obec neboli nájdené. Skúste iný názov alebo PSČ.");
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
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast.error("Váš prehliadač nepodporuje geolokáciu");
      return;
    }
    setIsLoadingLocation(true);

    // Request user's location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=sk`
          );

          if (!response.ok) {
            throw new Error("Nepodarilo sa získať informácie o polohe");
          }

          const data = await response.json();

          // Extract city name and region from the response
          const detectedCity = data.address?.city ||
                      data.address?.town ||
                      data.address?.village ||
                      data.address?.municipality ||
                      "";

          const detectedRegion = data.address?.state || "";

          // Check if the detected city exists in our database
          const cityInDatabase = slovakCities.find(
            (city) =>
              city.name.toLowerCase() === detectedCity.toLowerCase()
          );

          // Check if city has taxi services
          const hasTaxiServices = cityInDatabase && cityInDatabase.taxiServices && cityInDatabase.taxiServices.length > 0;

          if (cityInDatabase && hasTaxiServices) {
            // City found in database with taxi services, navigate to it directly
            toast.success(`Poloha nájdená: ${cityInDatabase.name}`);
            router.push(`/taxi/${cityInDatabase.slug}`);
          } else {
            // City not in database or has no taxi services, find nearest city from our list
            if (cityInDatabase && !hasTaxiServices) {
              toast.info(`${detectedCity} nemá zatiaľ taxislužby. Hľadám najbližšie mesto...`);
            } else {
              toast.info("Hľadám najbližšie mesto z nášho zoznamu...");
            }

            const nearestCity = await findNearestCity(
              latitude,
              longitude,
              detectedRegion,
              detectedCity  // Exclude the detected city from search
            );

            if (nearestCity) {
              const nearestCityData = slovakCities.find(
                (c) => c.name === nearestCity
              );

              if (nearestCityData) {
                toast.success(
                  detectedCity
                    ? `Najbližšie mesto: ${nearestCity} (ste v: ${detectedCity})`
                    : `Najbližšie mesto nájdené: ${nearestCity}`
                );
                router.push(`/taxi/${nearestCityData.slug}`);
              }
            } else {
              toast.error("Nepodarilo sa nájsť najbližšie mesto z nášho zoznamu");
            }
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          toast.error("Chyba pri získavaní informácií o polohe");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);

        // GeolocationPositionError codes:
        // PERMISSION_DENIED = 1, POSITION_UNAVAILABLE = 2, TIMEOUT = 3
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            toast.error("Prístup k polohe bol zamietnutý. Prosím, povoľte prístup v nastaveniach prehliadača.");
            break;
          case 2: // POSITION_UNAVAILABLE
            toast.error("Informácie o polohe nie sú dostupné");
            break;
          case 3: // TIMEOUT
            toast.error("Čas na získanie polohy vypršal");
            break;
          default:
            toast.error(`Chyba pri získavaní polohy (kód: ${error.code})`);
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
    <div className="w-full max-w-2xl mx-auto px-4 relative z-50">
      <div>
        <div className="bg-card rounded-xl md:rounded-2xl border-2 border-foreground/20 p-1.5 md:p-2 flex items-center gap-1.5 md:gap-2">
          <div className="flex-1 flex items-center gap-2 md:gap-3 px-2 md:px-4 relative" ref={dropdownRef}>
            <Search className="h-4 w-4 md:h-5 md:w-5 text-foreground flex-shrink-0" />
            <Input
              type="text"
              placeholder="Názov mesta, obce alebo PSČ..."
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

            {/* Autocomplete Dropdown */}
            {showDropdown && filteredResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg md:rounded-xl border-2 border-foreground/20 max-h-80 overflow-y-auto z-[9999] shadow-lg">
                {filteredResults.slice(0, 10).map((result, index) => (
                  <button
                    key={result.slug}
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
                    </div>
                    <div className="text-xs md:text-sm text-foreground/60 mt-0.5">{result.region}</div>
                  </button>
                ))}
                {filteredResults.length > 10 && (
                  <div className="px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm text-foreground/60 text-center border-t border-foreground/10">
                    Zobrazených prvých 10 z {filteredResults.length} výsledkov
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="default"
            size="icon"
            onClick={handleSearch}
            className="rounded-full h-10 w-10 md:h-12 md:w-12 flex-shrink-0"
          >
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={handleLocationClick}
            disabled={isLoadingLocation}
            className="rounded-full h-10 w-10 md:h-12 md:w-12 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </div>
      </div>

      <p className="text-center text-xs md:text-sm text-foreground font-bold mt-3 md:mt-4">
        Alebo použite svoju polohu pre okamžité vyhľadanie taxíkov v okolí
      </p>
    </div>
  );
};
