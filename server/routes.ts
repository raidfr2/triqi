import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMarkerSchema, routeSearchSchema, type RouteResult } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Marker routes
  
  // Get all markers
  app.get("/api/markers", async (req, res) => {
    try {
      const markers = await storage.getMarkers();
      res.json(markers);
    } catch (error) {
      console.error("Error fetching markers:", error);
      res.status(500).json({ error: "Failed to fetch markers" });
    }
  });

  // Get a specific marker
  app.get("/api/markers/:id", async (req, res) => {
    try {
      const marker = await storage.getMarker(req.params.id);
      if (!marker) {
        return res.status(404).json({ error: "Marker not found" });
      }
      res.json(marker);
    } catch (error) {
      console.error("Error fetching marker:", error);
      res.status(500).json({ error: "Failed to fetch marker" });
    }
  });

  // Create a new marker
  app.post("/api/markers", async (req, res) => {
    try {
      const markerData = insertMarkerSchema.parse(req.body);
      const marker = await storage.createMarker(markerData);
      res.status(201).json(marker);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid marker data", details: error.errors });
      }
      console.error("Error creating marker:", error);
      res.status(500).json({ error: "Failed to create marker" });
    }
  });

  // Update a marker
  app.put("/api/markers/:id", async (req, res) => {
    try {
      const updateData = insertMarkerSchema.partial().parse(req.body);
      const marker = await storage.updateMarker(req.params.id, updateData);
      if (!marker) {
        return res.status(404).json({ error: "Marker not found" });
      }
      res.json(marker);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid marker data", details: error.errors });
      }
      console.error("Error updating marker:", error);
      res.status(500).json({ error: "Failed to update marker" });
    }
  });

  // Delete a marker
  app.delete("/api/markers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMarker(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Marker not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting marker:", error);
      res.status(500).json({ error: "Failed to delete marker" });
    }
  });

  // Route search endpoints
  
  // Search for bus/transit routes
  app.post("/api/routes/search", async (req, res) => {
    try {
      const searchData = routeSearchSchema.parse(req.body);
      
      // For now, return mock data since we don't have the Google Maps API key yet
      const mockRoutes: RouteResult[] = [
        {
          duration: "45 min",
          distance: "12.5 km",
          steps: [
            {
              instruction: "Walk to Arrêt Université",
              distance: "150m",
              duration: "2 min"
            },
            {
              instruction: "Take Bus Line 12 towards Centre Ville",
              distance: "8.2km",
              duration: "25 min",
              transitDetails: {
                line: "Line 12",
                vehicle: "Bus",
                stop: "Arrêt Place d'Armes"
              }
            },
            {
              instruction: "Transfer to Bus Line 6",
              distance: "50m",
              duration: "1 min"
            },
            {
              instruction: "Take Bus Line 6 towards " + searchData.end,
              distance: "3.8km",
              duration: "15 min",
              transitDetails: {
                line: "Line 6",
                vehicle: "Bus",
                stop: searchData.end
              }
            },
            {
              instruction: "Walk to destination",
              distance: "200m",
              duration: "2 min"
            }
          ],
          bounds: {
            southwest: { lat: 35.6900, lng: -0.6500 },
            northeast: { lat: 35.7050, lng: -0.6200 }
          }
        },
        {
          duration: "52 min",
          distance: "14.2 km",
          steps: [
            {
              instruction: "Walk to Arrêt Faculté",
              distance: "200m",
              duration: "3 min"
            },
            {
              instruction: "Take Tram Line 1 towards Senia",
              distance: "10.5km",
              duration: "30 min",
              transitDetails: {
                line: "Line 1",
                vehicle: "Tram",
                stop: "Arrêt République"
              }
            },
            {
              instruction: "Transfer to Bus Line 8",
              distance: "100m",
              duration: "2 min"
            },
            {
              instruction: "Take Bus Line 8 towards " + searchData.end,
              distance: "3.5km",
              duration: "15 min",
              transitDetails: {
                line: "Line 8",
                vehicle: "Bus",
                stop: searchData.end
              }
            },
            {
              instruction: "Walk to destination",
              distance: "150m",
              duration: "2 min"
            }
          ],
          bounds: {
            southwest: { lat: 35.6900, lng: -0.6500 },
            northeast: { lat: 35.7050, lng: -0.6200 }
          }
        }
      ];

      // Add some delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json(mockRoutes);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search data", details: error.errors });
      }
      console.error("Error searching routes:", error);
      res.status(500).json({ error: "Failed to search routes" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
