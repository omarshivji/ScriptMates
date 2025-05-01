import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Don't modify the auth tables - they're managed by Convex Auth
export default defineSchema({
  ...authTables,
  rooms: defineTable({
    name: v.string(),
    duration: v.float64(),
    status: v.string(),
    participants: v.optional(v.array(v.object({
      _id: v.string(),
      userId: v.id("users"),
      task: v.string(),
      mood: v.optional(v.string()),
      nowPlaying: v.optional(v.string()),
      joinTime: v.float64(),
    }))),
  }),
  userPreferences: defineTable({
    userId: v.id("users"),
    hasSeenWelcome: v.boolean(),
  }).index("by_user", ["userId"]),

  onlineUsers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    lastSeen: v.number(), // store Unix timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_lastSeen", ["lastSeen"])
});
