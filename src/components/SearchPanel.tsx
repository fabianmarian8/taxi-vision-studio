import { Search, MapPin, Loader2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { findNearestCity } from "@/lib/locationUtils";
import { slovakCities } from "@/data/cities";

export const SearchPanel = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState(slovakCities);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter cities based on search input
  useEffect(() => {
    if (searchValue.trim()) {
      const filtered = slovakCities.filter((city) =>
        city.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowDropdown(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setFilteredCities(slovakCities);
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

  const navigateToCity = (cityName: string) => {
    const city = slovakCities.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );

    if (city) {
      navigate(`/taxi/${city.slug}`);
      setShowDropdown(false);
      setSearchValue("");
    } else {
      toast.error(`Mesto "${cityName}" nebolo nájdené v našom zozname`);
    }
  };

  const handleSearch = () => {
    if (!searchValue.trim()) {
      toast.error("Zadajte názov mesta");
      return;
    }

    // Try exact match first
    const exactMatch = slovakCities.find(
      (city) => city.name.toLowerCase() === searchValue.toLowerCase()
    );

    if (exactMatch) {
      navigateToCity(exactMatch.name);
    } else if (filteredCities.length > 0) {
      // Use first filtered result
      navigateToCity(filteredCities[0].name);
    } else {
      toast.error("Mesto nebolo nájdené. Skúste iný názov.");
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
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredCities.length) {
          navigateToCity(filteredCities[selectedIndex].name);
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
            navigate(`/taxi/${cityInDatabase.slug}`);
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
                navigate(`/taxi/${nearestCityData.slug}`);
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

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Prístup k polohe bol zamietnutý. Prosím, povoľte prístup v nastaveniach prehliadača.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Informácie o polohe nie sú dostupné");
            break;
          case error.TIMEOUT:
            toast.error("Čas na získanie polohy vypršal");
            break;
          default:
            toast.error("Neznáma chyba pri získavaní polohy");
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
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="perspective-1000">
        <div className="bg-card rounded-xl md:rounded-2xl shadow-3d-lg p-1.5 md:p-2 flex items-center gap-1.5 md:gap-2 card-3d">
          <div className="flex-1 flex items-center gap-2 md:gap-3 px-2 md:px-4 relative" ref={dropdownRef}>
            <Search className="h-4 w-4 md:h-5 md:w-5 text-foreground flex-shrink-0" />
            <Input
              type="text"
              placeholder="Zadajte názov mesta..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchValue.trim() && filteredCities.length > 0) {
                  setShowDropdown(true);
                }
              }}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base placeholder:text-muted-foreground text-foreground font-medium"
            />

            {/* Autocomplete Dropdown */}
            {showDropdown && filteredCities.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg md:rounded-xl shadow-3d-lg border-2 border-foreground/10 max-h-80 overflow-y-auto z-50">
                {filteredCities.slice(0, 10).map((city, index) => (
                  <button
                    key={city.slug}
                    onClick={() => navigateToCity(city.name)}
                    className={`w-full text-left px-4 md:px-6 py-2 md:py-3 hover:bg-foreground/5 transition-colors border-b border-foreground/5 last:border-b-0 ${
                      index === selectedIndex ? "bg-foreground/10" : ""
                    }`}
                  >
                    <div className="font-semibold text-sm md:text-base text-foreground">{city.name}</div>
                    <div className="text-xs md:text-sm text-foreground/60">{city.region}</div>
                  </button>
                ))}
                {filteredCities.length > 10 && (
                  <div className="px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm text-foreground/60 text-center border-t border-foreground/10">
                    Zobrazených prvých 10 z {filteredCities.length} miest
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="default"
            size="icon"
            onClick={handleSearch}
            className="rounded-full h-10 w-10 md:h-12 md:w-12 shadow-3d-sm hover:shadow-3d-md transition-shadow flex-shrink-0"
          >
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={handleLocationClick}
            disabled={isLoadingLocation}
            className="rounded-full h-10 w-10 md:h-12 md:w-12 shadow-3d-sm hover:shadow-3d-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
