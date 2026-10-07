import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const appRole = pgEnum("app_role", ["admin", "user"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  village: text("village"),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  imageUrl: text("image_url"),
  crop: text("crop"),
  disease: text("disease").notNull(),
  severityLabel: text("severity_label").notNull().default("low"),
  severityScore: integer("severity_score").notNull().default(0),
  summary: text("summary"),
  steps: jsonb("steps").notNull().default([]),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  role: appRole("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fertilizers = pgTable("fertilizers", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("chemical"),
  nutrients: text("nutrients"),
  crops: text("crops").array().notNull().default([]),
  problems: text("problems").array().notNull().default([]),
  dosage: text("dosage"),
  timing: text("timing"),
  priceRange: text("price_range"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
