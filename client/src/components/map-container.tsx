import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Maximize2, 
  Info, 
  MapPin, 
  X,
  Crosshair,
  Loader2,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

declare global {
  interface Window {
    mapboxgl: any;
  }
}

interface MapInfo {
  zoom: number;
  center: { lat: number; lng: number };
}

interface Marker {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  color: string;
  createdAt: string;
}

export default function MapContainer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [mapInfo, setMapInfo] = useState<MapInfo>({
    zoom: 12,
    center: { lat: 40.7128, lng: -74.006 }
  });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Check for WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('WebGL not supported - map will not render');
        setMapError('WebGL is not supported in this browser. The interactive map cannot be displayed.');
        setIsLoading(false);
        return;
      }

      // Mapbox access token from environment
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      
      if (!accessToken) {
        setMapError('Mapbox access token is required. Please set VITE_MAPBOX_ACCESS_TOKEN environment variable.');
        setIsLoading(false);
        return;
      }
      
      window.mapboxgl.accessToken = accessToken;

      // Initialize map with custom style
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/raidfr2/cmfdzy5bs009n01sjhh8ddvo6',
        center: [-74.006, 40.7128], // NYC
        zoom: 12,
        pitch: 0,
        bearing: 0,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      return;
    }

    // Add navigation controls
    const nav = new window.mapboxgl.NavigationControl();
    map.current.addControl(nav, 'top-right');

    // Add fullscreen control
    const fullscreen = new window.mapboxgl.FullscreenControl();
    map.current.addControl(fullscreen, 'top-right');

    // Add scale control
    const scale = new window.mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'imperial'
    });
    map.current.addControl(scale, 'bottom-left');

    // Update map info function
    const updateMapInfo = () => {
      if (map.current) {
        const zoom = map.current.getZoom();
        const center = map.current.getCenter();
        setMapInfo({
          zoom: zoom,
          center: { lat: center.lat, lng: center.lng }
        });
      }
    };

    // Event listeners
    map.current.on('load', () => {
      setIsLoading(false);
      updateMapInfo();
      loadMarkers();
    });

    map.current.on('moveend', updateMapInfo);
    map.current.on('zoomend', updateMapInfo);

    map.current.on('click', (e: any) => {
      const coordinates = e.lngLat;
      console.log(`Clicked at: ${coordinates.lng}, ${coordinates.lat}`);
    });

    map.current.on('error', (e: any) => {
      console.error('Map error:', e.error);
      setMapError(`Map error: ${e.error?.message || 'Failed to load map'}`);
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const resetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: [-74.006, 40.7128],
        zoom: 12,
        pitch: 0,
        bearing: 0,
        duration: 2000
      });
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 2000
          });
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        // Could show a toast here in the future
        console.warn(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleStyleToggle = () => {
    // Placeholder for future style switching functionality
    console.log('Style toggle clicked - implement style switching');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInfoPanel(false);
      }
      if (e.key === 'i' || e.key === 'I') {
        setShowInfoPanel(prev => !prev);
      }
      if (e.key === 'r' || e.key === 'R') {
        resetView();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        data-testid="map-container"
      />
      
      {/* Header Panel */}
      <div className="absolute top-4 left-4 right-4 z-10 fade-in">
        <Card className="bg-card/95 backdrop-blur-sm border border-border shadow-lg mx-auto max-w-4xl">
          <CardContent className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-card-foreground">Interactive Map</h1>
                <p className="text-sm text-muted-foreground mt-1">Explore with custom styling and controls</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Map Style Toggle */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStyleToggle}
                  className="flex items-center space-x-2"
                  data-testid="button-style-toggle"
                >
                  <Heart className="w-4 h-4" />
                  <span>Style</span>
                </Button>
                
                {/* Fullscreen Toggle */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="flex items-center space-x-2"
                  data-testid="button-fullscreen-toggle"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Fullscreen</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Map Info Panel */}
      {showInfoPanel && (
        <div className="absolute bottom-4 left-4 z-10 max-w-sm">
          <Card className="bg-card/95 backdrop-blur-sm border border-border shadow-lg fade-in">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-card-foreground">Map Information</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfoPanel(false)}
                  className="p-0 h-auto text-muted-foreground hover:text-foreground"
                  data-testid="button-close-info"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zoom Level:</span>
                  <span className="font-medium text-card-foreground" data-testid="text-zoom-level">
                    {mapInfo.zoom.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Center:</span>
                  <span className="font-mono text-xs text-card-foreground" data-testid="text-center-coords">
                    {mapInfo.center.lat.toFixed(4)}, {mapInfo.center.lng.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Style:</span>
                  <span className="text-primary font-medium">Custom</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Bottom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-3">
        {/* Map Info Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowInfoPanel(prev => !prev)}
          className="bg-card/95 backdrop-blur-sm border border-border hover:bg-accent/50 shadow-lg transition-all duration-200 hover:scale-105"
          data-testid="button-info-toggle"
        >
          <Info className="w-5 h-5" />
        </Button>
        
        {/* Geolocation */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleGeolocation}
          disabled={isLocating}
          className="bg-card/95 backdrop-blur-sm border border-border hover:bg-accent/50 shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
          data-testid="button-geolocation"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Crosshair className="w-5 h-5" />
          )}
        </Button>
        
        {/* Reset View */}
        <Button
          variant="outline"
          size="icon"
          onClick={resetView}
          className="bg-card/95 backdrop-blur-sm border border-border hover:bg-accent/50 shadow-lg transition-all duration-200 hover:scale-105"
          data-testid="button-reset-view"
        >
          <MapPin className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && !mapError && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
          <Card className="border border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-card-foreground font-medium">Loading Map...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Error Display */}
      {mapError && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
          <Card className="border border-destructive shadow-lg max-w-md mx-4 pointer-events-auto">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-destructive mb-4">
                  <MapPin className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Map Unavailable</h3>
                <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="default"
                  data-testid="button-reload-page"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
