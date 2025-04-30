import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  rooms: defineTable({
    name: v.string(),
    duration: v.number(),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("completed")),
    startTime: v.number(),
  }),
  participants: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    task: v.string(),
    joinedAt: v.number(),
  }).index("by_room", ["roomId"]),
});
