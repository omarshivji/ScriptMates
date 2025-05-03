import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const updateProfile = mutation({
  args: {
    avatarId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const url = await ctx.storage.getUrl(args.avatarId);
    if (!url) throw new Error("Failed to get storage URL");

    await ctx.db.patch(userId, {
      image: url,
    });
  },
});

export const getProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      ...user,
      avatarUrl: user.image,
    };
  },
});

export const setName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { name: args.name });
    // Also update onlineUsers table if present
    const online = await ctx.db
      .query("onlineUsers")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();
    if (online) {
      await ctx.db.patch(online._id, { name: args.name });
    }
  },
});

export const setAvatar = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { image: args.url });
  },
});
