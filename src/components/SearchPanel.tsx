import { Search, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export const SearchPanel = () => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl shadow-lifted p-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-3 px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter city name..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 border-0 shadow-medium hover:shadow-lifted transition-all"
        >
          <MapPin className="h-5 w-5 text-primary-foreground" />
        </Button>
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-4">
        Or use your location to find nearby taxis instantly
      </p>
    </div>
  );
};
