import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_TIMEOUT_MS = 60000;

export const setOnline = mutation({
  args: { userId: v.id("users"), name: v.string() }, // Change here to use v.id("users")
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("onlineUsers")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: Date.now() });
    } else {
      await ctx.db.insert("onlineUsers", {
        userId: args.userId,  // Pass the userId as is, it's already typed correctly
        name: args.name,
        lastSeen: Date.now(),
      });
    }
  },
});

export const getOnlineUsers = query({
  handler: async (ctx) => {
    const now = Date.now();
    const users = await ctx.db.query("onlineUsers").collect();
    return users.filter((u) => now - u.lastSeen < ONLINE_TIMEOUT_MS);
  },
});
