import { Search, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export const SearchPanel = () => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="perspective-1000">
        <div className="bg-card rounded-2xl shadow-3d-lg p-2 flex items-center gap-2 card-3d">
        <div className="flex-1 flex items-center gap-3 px-4">
          <Search className="h-5 w-5 text-foreground" />
          <Input
            type="text"
            placeholder="Zadajte názov mesta..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground text-foreground font-medium"
          />
        </div>
        
        <Button 
          variant="default" 
          size="icon"
          className="rounded-full h-12 w-12 shadow-3d-sm hover:shadow-3d-md transition-all hover:scale-105"
        >
          <MapPin className="h-5 w-5" />
        </Button>
        </div>
      </div>
      
      <p className="text-center text-sm text-foreground font-bold mt-4">
        Alebo použite svoju polohu pre okamžité vyhľadanie taxíkov v okolí
      </p>
    </div>
  );
};
