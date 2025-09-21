import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const markers = pgTable("markers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMarkerSchema = createInsertSchema(markers).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMarker = z.infer<typeof insertMarkerSchema>;
export type Marker = typeof markers.$inferSelect;

// Route search schemas
export const routeSearchSchema = z.object({
  start: z.string().min(1, "Start location is required"),
  end: z.string().min(1, "End location is required"),
  mode: z.enum(['driving', 'walking', 'transit', 'bicycling']).default('transit')
});

export const routeStepSchema = z.object({
  instruction: z.string(),
  distance: z.string().optional(),
  duration: z.string().optional(),
  transitDetails: z.object({
    line: z.string(),
    vehicle: z.string(),
    stop: z.string()
  }).optional()
});

export const routeSchema = z.object({
  duration: z.string(),
  distance: z.string(),
  steps: z.array(routeStepSchema),
  bounds: z.object({
    southwest: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    northeast: z.object({
      lat: z.number(),
      lng: z.number()
    })
  }).optional()
});

export type RouteSearchRequest = z.infer<typeof routeSearchSchema>;
export type RouteResult = z.infer<typeof routeSchema>;
export type RouteStep = z.infer<typeof routeStepSchema>;
