import { useEffect, useState } from "react";
import MapContainer from "@/components/map-container";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Mapbox GL JS is loaded
    const checkMapboxLoaded = () => {
      if (typeof window !== 'undefined' && window.mapboxgl) {
        setIsLoaded(true);
      } else {
        setTimeout(checkMapboxLoaded, 100);
      }
    };
    
    checkMapboxLoaded();
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-card-foreground font-medium">Loading Map...</span>
          </div>
        </div>
      </div>
    );
  }

  return <MapContainer />;
}
