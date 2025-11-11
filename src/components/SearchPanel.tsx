import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { findNearestCity } from "@/lib/locationUtils";
import { slovakCities } from "@/data/cities";

export const SearchPanel = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

          if (cityInDatabase) {
            // City found in database, use it directly
            setSearchValue(cityInDatabase.name);
            toast.success(`Poloha nájdená: ${cityInDatabase.name}`);
          } else {
            // City not in database, find nearest city from our list
            toast.info("Hľadám najbližšie mesto z nášho zoznamu...");

            const nearestCity = await findNearestCity(
              latitude,
              longitude,
              detectedRegion
            );

            if (nearestCity) {
              setSearchValue(nearestCity);
              toast.success(
                detectedCity
                  ? `Najbližšie mesto v našom zozname: ${nearestCity} (ste v: ${detectedCity})`
                  : `Najbližšie mesto nájdené: ${nearestCity}`
              );
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="perspective-1000">
        <div className="bg-card rounded-2xl shadow-3d-lg p-2 flex items-center gap-2 card-3d">
        <div className="flex-1 flex items-center gap-3 px-4">
          <Search className="h-5 w-5 text-foreground" />
          <Input
            type="text"
            placeholder="Zadajte názov mesta..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground text-foreground font-medium"
          />
        </div>

        <Button
          variant="default"
          size="icon"
          onClick={handleLocationClick}
          disabled={isLoadingLocation}
          className="rounded-full h-12 w-12 shadow-3d-sm hover:shadow-3d-md transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingLocation ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </Button>
        </div>
      </div>

      <p className="text-center text-sm text-foreground font-bold mt-4">
        Alebo použite svoju polohu pre okamžité vyhľadanie taxíkov v okolí
      </p>
    </div>
  );
};
