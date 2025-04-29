import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  rooms: defineTable({
    name: v.string(),
    duration: v.number(), // minutes
    startTime: v.number(), // timestamp
    status: v.string(), // "waiting" | "active" | "completed"
  }),
  participants: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    task: v.string(),
    joinedAt: v.number(),
  }).index("by_room", ["roomId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
