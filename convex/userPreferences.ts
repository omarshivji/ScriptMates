import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getHasSeenWelcome = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();

    return preferences?.hasSeenWelcome ?? false;
  },
});

export const markWelcomeSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();

    if (preferences) {
      await ctx.db.patch(preferences._id, {
        hasSeenWelcome: true,
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        hasSeenWelcome: true,
      });
    }
  },
});
