import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db.query("rooms").collect();
    return await Promise.all(
      rooms.map(async (room) => {
        const participants = await ctx.db
          .query("participants")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();
        return { ...room, participants };
      })
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    duration: v.number(),
    task: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      duration: args.duration,
      status: "waiting",
      startTime: Date.now(),
    });

    await ctx.db.insert("participants", {
      roomId,
      userId,
      task: args.task,
      joinedAt: Date.now(),
    });

    return roomId;
  },
});

export const join = mutation({
  args: {
    roomId: v.id("rooms"),
    task: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const existing = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (existing.length === 0) {
      await ctx.db.patch(args.roomId, {
        status: "active",
        startTime: Date.now(),
      });
    }

    return await ctx.db.insert("participants", {
      roomId: args.roomId,
      userId,
      task: args.task,
      joinedAt: Date.now(),
    });
  },
});

export const leave = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (!participant) throw new Error("Not in room");

    await ctx.db.delete(participant._id);

    const remaining = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (remaining.length === 0) {
      await ctx.db.patch(args.roomId, {
        status: "completed",
      });
    }
  },
});
