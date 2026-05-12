import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import journeys from "./journeys.ts";
import gamification from "./gamification.ts";
const app = new Hono().basePath("/server");

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-161cb90c/health", (c) => {
  return c.json({ status: "ok" });
});

// Phase 1: Faith Journeys & Milestones API
app.route("/make-server-161cb90c/journeys", journeys);

// Phase 2: Gamification — Profiles, Points, Rules Engine
app.route("/make-server-161cb90c/gamification", gamification);

Deno.serve(app.fetch);