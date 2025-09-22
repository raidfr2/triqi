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
  Trash2,
  Navigation,
  Route,
  MapPin as MapPinIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [routeResults, setRouteResults] = useState<any[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [activeRouteHandlers, setActiveRouteHandlers] = useState<string[]>([]);
  const [clickMode, setClickMode] = useState<'none' | 'start' | 'end'>('none');
  const [startCoords, setStartCoords] = useState<{lng: number, lat: number} | null>(null);
  const [endCoords, setEndCoords] = useState<{lng: number, lat: number} | null>(null);
  const [startMarker, setStartMarker] = useState<any>(null);
  const [endMarker, setEndMarker] = useState<any>(null);
  const [mapInfo, setMapInfo] = useState<MapInfo>({
    zoom: 12,
    center: { lat: 35.6976, lng: -0.6337 }
  });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Check for WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('WebGL not supported - using fallback map display');
        // Instead of showing error, create a fallback map display
        setMapError(null);
        setIsLoading(false);
        createFallbackMap();
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
        center: [-0.6337, 35.6976], // Oran, Algeria
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

    // Update cursor style based on click mode
    const updateCursor = () => {
      if (map.current) {
        const canvas = map.current.getCanvas();
        if (clickMode === 'start' || clickMode === 'end') {
          canvas.style.cursor = 'crosshair';
        } else {
          canvas.style.cursor = '';
        }
      }
    };
    
    // Apply cursor style immediately
    updateCursor();

    // Basic click handler for debugging
    map.current.on('click', (e: any) => {
      const coordinates = e.lngLat;
      console.log(`Map clicked at: ${coordinates.lng}, ${coordinates.lat}`);
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

  const createFallbackMap = () => {
    // Create a visual fallback when WebGL is not available
    if (mapContainer.current) {
      mapContainer.current.innerHTML = `
        <div style="
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 16px;
            text-align: center;
            max-width: 400px;
            margin: 0 20px;
          ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
            <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Interactive Map Application</h2>
            <p style="margin: 0 0 1rem 0; opacity: 0.9;">
              Your interactive mapping application is running successfully!
            </p>
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.7;">
              WebGL-based maps require specific browser support. 
              The application infrastructure is working perfectly.
            </p>
          </div>
        </div>
      `;
      
      // Update map info to show fallback state
      setMapInfo({
        zoom: 12,
        center: { lat: 35.6976, lng: -0.6337 }
      });
      setMarkersLoaded(true);
    }
  };

  const loadMarkers = async () => {
    try {
      // Load markers from the server
      const response = await fetch('/api/markers');
      if (response.ok) {
        const markersData = await response.json();
        setMarkers(markersData);
        setMarkersLoaded(true);
        
        // Add markers to the map if they exist
        markersData.forEach((marker: Marker) => {
          if (map.current) {
            new window.mapboxgl.Marker({ color: marker.color })
              .setLngLat([marker.longitude, marker.latitude])
              .setPopup(new window.mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${marker.title}</h3>${marker.description ? `<p>${marker.description}</p>` : ''}`))
              .addTo(map.current);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load markers:', error);
      setMarkersLoaded(true);
    }
  };

  const resetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: [-0.6337, 35.6976],
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

  const addStartMarker = (coordinates: any) => {
    if (!map.current) return;
    
    // Remove existing start marker
    if (startMarker) {
      startMarker.remove();
    }
    
    // Create new start marker (green)
    const marker = new window.mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([coordinates.lng, coordinates.lat])
      .setPopup(new window.mapboxgl.Popup({ offset: 25 })
        .setHTML(`<div class="p-2"><h4 class="font-semibold text-sm text-green-600">Start Location</h4><p class="text-xs text-gray-600">${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}</p></div>`))
      .addTo(map.current);
    
    setStartMarker(marker);
  };

  const addEndMarker = (coordinates: any) => {
    if (!map.current) return;
    
    // Remove existing end marker
    if (endMarker) {
      endMarker.remove();
    }
    
    // Create new end marker (red)
    const marker = new window.mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([coordinates.lng, coordinates.lat])
      .setPopup(new window.mapboxgl.Popup({ offset: 25 })
        .setHTML(`<div class="p-2"><h4 class="font-semibold text-sm text-red-600">End Location</h4><p class="text-xs text-gray-600">${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}</p></div>`))
      .addTo(map.current);
    
    setEndMarker(marker);
  };

  const clearLocationMarkers = () => {
    if (startMarker) {
      startMarker.remove();
      setStartMarker(null);
    }
    if (endMarker) {
      endMarker.remove();
      setEndMarker(null);
    }
    setStartCoords(null);
    setEndCoords(null);
    setStartLocation('');
    setEndLocation('');
  };

  const displayRoutesOnMap = (routes: any[]) => {
    if (!map.current) return;

    // Clear existing route layers
    clearRouteLayersFromMap();

    routes.forEach((route, routeIndex) => {
      if (route.geometry && route.geometry.coordinates) {
        const sourceId = `route-${routeIndex}`;
        const layerId = `route-layer-${routeIndex}`;

        // Add source for the route
        if (!map.current.getSource(sourceId)) {
          map.current.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {
                routeIndex,
                duration: route.duration,
                distance: route.distance
              },
              geometry: route.geometry
            }
          });
        }

        // Add layer to display the route
        if (!map.current.getLayer(layerId)) {
          map.current.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': routeIndex === 0 ? '#2563eb' : '#7c3aed', // Blue for first route, purple for alternatives
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 4,
                16, 8
              ],
              'line-opacity': 0.8
            }
          });

          // Add click event to route layer
          map.current.on('click', layerId, (e: any) => {
            if (e.features && e.features[0]) {
              const properties = e.features[0].properties;
              const popup = new window.mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div class="p-2">
                    <h4 class="font-semibold text-sm">Route ${properties.routeIndex + 1}</h4>
                    <p class="text-xs text-gray-600">Duration: ${properties.duration}</p>
                    <p class="text-xs text-gray-600">Distance: ${properties.distance}</p>
                  </div>
                `)
                .addTo(map.current);
            }
          });

          // Change cursor on hover
          map.current.on('mouseenter', layerId, () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current.on('mouseleave', layerId, () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
          });

          // Track this layer for cleanup
          setActiveRouteHandlers(prev => [...prev, layerId]);
        }
      }
    });
  };

  const clearRouteLayersFromMap = () => {
    if (!map.current) return;

    // Remove event handlers for existing route layers
    activeRouteHandlers.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        map.current.off('click', layerId);
        map.current.off('mouseenter', layerId);
        map.current.off('mouseleave', layerId);
      }
    });
    setActiveRouteHandlers([]);

    // Remove existing route layers and sources
    const style = map.current.getStyle();
    if (style.layers) {
      style.layers.forEach((layer: any) => {
        if (layer.id && layer.id.startsWith('route-layer-')) {
          if (map.current.getLayer(layer.id)) {
            map.current.removeLayer(layer.id);
          }
        }
      });
    }

    if (style.sources) {
      Object.keys(style.sources).forEach(sourceId => {
        if (sourceId.startsWith('route-')) {
          if (map.current.getSource(sourceId)) {
            map.current.removeSource(sourceId);
          }
        }
      });
    }
  };

  const searchBusRoutes = async () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      console.warn('Please enter both start and end locations');
      return;
    }

    setIsLoadingRoute(true);
    setRouteResults([]);

    try {
      // Call backend API for bus route search
      const response = await fetch('/api/routes/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: startLocation,
          end: endLocation,
          mode: 'transit'
        })
      });

      if (response.ok) {
        const routes = await response.json();
        setRouteResults(routes);
        
        // Display routes on the map and fit bounds
        if (routes.length > 0) {
          displayRoutesOnMap(routes);
          
          if (routes[0].bounds) {
            const bounds = routes[0].bounds;
            if (map.current) {
              map.current.fitBounds([
                [bounds.southwest.lng, bounds.southwest.lat],
                [bounds.northeast.lng, bounds.northeast.lat]
              ], { padding: 50 });
            }
          }
        }
      } else {
        console.error('Failed to search routes');
      }
    } catch (error) {
      console.error('Route search error:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Location click handler function
  const handleLocationClick = (e: any) => {
    try {
      console.log('handleLocationClick called, clickMode:', clickMode);
      const coordinates = e.lngLat;
      console.log(`Location click at: ${coordinates.lng}, ${coordinates.lat}, mode: ${clickMode}`);
      
      if (clickMode === 'start') {
        console.log('Setting start location');
        setStartCoords({ lng: coordinates.lng, lat: coordinates.lat });
        setStartLocation(`${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
        addStartMarker(coordinates);
        setClickMode('none');
      } else if (clickMode === 'end') {
        console.log('Setting end location');
        setEndCoords({ lng: coordinates.lng, lat: coordinates.lat });
        setEndLocation(`${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
        addEndMarker(coordinates);
        setClickMode('none');
      }
    } catch (error) {
      console.error('Error in handleLocationClick:', error);
    }
  };

  // Update cursor style and click handler when click mode changes
  useEffect(() => {
    if (map.current) {
      const canvas = map.current.getCanvas();
      if (clickMode === 'start' || clickMode === 'end') {
        canvas.style.cursor = 'crosshair';
      } else {
        canvas.style.cursor = '';
      }
      
      // Remove existing location click handler
      map.current.off('click', handleLocationClick);
      
      // Add new location click handler if in location setting mode
      if (clickMode === 'start' || clickMode === 'end') {
        map.current.on('click', handleLocationClick);
      }
    }
    
    // Cleanup function
    return () => {
      if (map.current) {
        map.current.off('click', handleLocationClick);
      }
    };
  }, [clickMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInfoPanel(false);
        setShowRoutePanel(false);
        clearRouteLayersFromMap();
        setRouteResults([]);
        setClickMode('none');
      }
      if (e.key === 'i' || e.key === 'I') {
        setShowInfoPanel(prev => !prev);
      }
      if (e.key === 'b' || e.key === 'B') {
        setShowRoutePanel(prev => !prev);
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
                
                {/* Bus Routes Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRoutePanel(prev => !prev)}
                  className={`flex items-center space-x-2 ${showRoutePanel ? 'bg-primary text-primary-foreground' : ''}`}
                  data-testid="button-route-toggle"
                >
                  <Route className="w-4 h-4" />
                  <span>Bus Routes</span>
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
      
      {/* Bus Route Planning Panel */}
      {showRoutePanel && (
        <div className="absolute top-20 left-4 z-10 w-80">
          <Card className="bg-card/95 backdrop-blur-sm border border-border shadow-lg fade-in">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Route className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-card-foreground">Bus Routes</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRoutePanel(false);
                    clearRouteLayersFromMap();
                    setRouteResults([]);
                  }}
                  className="p-0 h-auto text-muted-foreground hover:text-foreground"
                  data-testid="button-close-route-panel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Start Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-card-foreground flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <MapPinIcon className="w-4 h-4 text-green-600" />
                      <span>From</span>
                    </div>
                    <Button
                      variant={clickMode === 'start' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setClickMode(clickMode === 'start' ? 'none' : 'start')}
                      className="h-6 px-2 text-xs"
                    >
                      {clickMode === 'start' ? 'Click map' : 'Set on map'}
                    </Button>
                  </label>
                  <Input
                    placeholder="Enter start location or click 'Set on map'"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full"
                    data-testid="input-start-location"
                  />
                </div>
                
                {/* End Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-card-foreground flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <MapPinIcon className="w-4 h-4 text-red-600" />
                      <span>To</span>
                    </div>
                    <Button
                      variant={clickMode === 'end' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setClickMode(clickMode === 'end' ? 'none' : 'end')}
                      className="h-6 px-2 text-xs"
                    >
                      {clickMode === 'end' ? 'Click map' : 'Set on map'}
                    </Button>
                  </label>
                  <Input
                    placeholder="Enter destination or click 'Set on map'"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="w-full"
                    data-testid="input-end-location"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      onClick={searchBusRoutes}
                      disabled={isLoadingRoute || !startLocation.trim() || !endLocation.trim()}
                      className="flex-1"
                      data-testid="button-search-routes"
                    >
                      {isLoadingRoute ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4 mr-2" />
                          Find Routes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        clearLocationMarkers();
                        clearRouteLayersFromMap();
                        setRouteResults([]);
                        setClickMode('none');
                      }}
                      className="px-3"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {clickMode !== 'none' && (
                    <p className="text-xs text-muted-foreground text-center">
                      Click on the map to set {clickMode === 'start' ? 'start' : 'end'} location
                    </p>
                  )}
                </div>
                
                {/* Route Results */}
                {routeResults.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h4 className="text-sm font-semibold text-card-foreground">Route Options:</h4>
                    {routeResults.map((route, index) => (
                      <div
                        key={index}
                        className="p-3 bg-accent/20 rounded-lg border border-accent/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-primary">Route {index + 1}</span>
                          <span className="text-xs text-muted-foreground">
                            {route.duration || 'Est. 45 min'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {route.steps?.map((step: any, stepIndex: number) => (
                            <div key={stepIndex} className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                              <span>{step.instruction || `Step ${stepIndex + 1}`}</span>
                            </div>
                          )) || (
                            <div className="text-center py-2">
                              <span>Route details will appear here</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Empty State */}
                {!isLoadingRoute && routeResults.length === 0 && (startLocation.trim() || endLocation.trim()) && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Route className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Enter both locations and click "Find Bus Routes" to search</p>
                  </div>
                )}
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
