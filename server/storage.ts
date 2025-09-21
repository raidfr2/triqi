import { type User, type InsertUser, type Marker, type InsertMarker, users, markers } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Marker operations
  getMarkers(): Promise<Marker[]>;
  getMarker(id: string): Promise<Marker | undefined>;
  createMarker(marker: InsertMarker): Promise<Marker>;
  updateMarker(id: string, marker: Partial<InsertMarker>): Promise<Marker | undefined>;
  deleteMarker(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Marker operations
  async getMarkers(): Promise<Marker[]> {
    return await db.select().from(markers).orderBy(markers.createdAt);
  }

  async getMarker(id: string): Promise<Marker | undefined> {
    const [marker] = await db.select().from(markers).where(eq(markers.id, id));
    return marker || undefined;
  }

  async createMarker(insertMarker: InsertMarker): Promise<Marker> {
    const [marker] = await db
      .insert(markers)
      .values(insertMarker)
      .returning();
    return marker;
  }

  async updateMarker(id: string, updateData: Partial<InsertMarker>): Promise<Marker | undefined> {
    const [marker] = await db
      .update(markers)
      .set(updateData)
      .where(eq(markers.id, id))
      .returning();
    return marker || undefined;
  }

  async deleteMarker(id: string): Promise<boolean> {
    const result = await db.delete(markers).where(eq(markers.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
