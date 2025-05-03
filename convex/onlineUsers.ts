import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_TIMEOUT_MS = 30000;

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

// New: get online users with XP and level
export const getOnlineUsersWithXP = query({
  handler: async (ctx) => {
    const now = Date.now();
    const online = await ctx.db.query("onlineUsers").collect();
    const filtered = online.filter((u) => now - u.lastSeen < ONLINE_TIMEOUT_MS);
    // Fetch XP and image for each user
    const result = [];
    for (const u of filtered) {
      const userDoc = await ctx.db.get(u.userId);
      let xp = 0;
      let isAnonymous = false;
      let image = undefined;
      if (userDoc) {
        xp = userDoc.xp || 0;
        isAnonymous = 'tokenIdentifier' in userDoc;
        image = userDoc.image || undefined;
      }
      result.push({
        userId: u.userId,
        name: u.name,
        xp,
        level: isAnonymous ? null : Math.floor(xp / 100) + 1,
        isAnonymous,
        image,
      });
    }
    return result;
  },
});
