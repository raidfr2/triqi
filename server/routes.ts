import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMarkerSchema } from "@shared/schema";
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

  const httpServer = createServer(app);

  return httpServer;
}
