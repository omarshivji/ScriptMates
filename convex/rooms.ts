import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const init = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing rooms
    const rooms = await ctx.db.query("rooms").collect();
    for (const room of rooms) {
      await ctx.db.delete(room._id);
    }

    // Create preset rooms
    await ctx.db.insert("rooms", {
      name: "Quick Break",
      duration: 15,
      status: "active",
      participants: [],
    });

    await ctx.db.insert("rooms", {
      name: "Focus Session",
      duration: 25,
      status: "active",
      participants: [],
    });

    await ctx.db.insert("rooms", {
      name: "Deep Work",
      duration: 45,
      status: "active",
      participants: [],
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rooms").collect();
  },
});

export const join = mutation({
  args: {
    roomId: v.id("rooms"),
    task: v.string(),
    mood: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const participants = room.participants || [];
    
    // Check if user is already in this or another room
    const isInRoom = participants.some(p => p.userId === userId);
    if (isInRoom) throw new Error("Already in this room");

    const allRooms = await ctx.db.query("rooms").collect();
    const isInAnotherRoom = allRooms.some(r => 
      r.participants?.some(p => p.userId === userId)
    );
    if (isInAnotherRoom) throw new Error("Already in another room");

    // Add user to room
    await ctx.db.patch(args.roomId, {
      participants: [...participants, {
        _id: Math.random().toString(),
        userId,
        task: args.task,
        mood: args.mood,
        joinTime: Date.now(),
      }],
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

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const participants = room.participants || [];
    const leavingParticipant = participants.find(p => p.userId === userId);

    // Only award XP if user is registered (not anonymous) and completed the timer
    if (leavingParticipant) {
      // Check if user is registered (not anonymous)
      const user = await ctx.db.get(userId);
      // Convex Auth: anonymous users have a 'tokenIdentifier' field
      if (user && !('tokenIdentifier' in user)) {
        // Calculate time spent in room
        const joinTime = leavingParticipant.joinTime;
        const now = Date.now();
        const minsSpent = (now - joinTime) / 1000 / 60;
        // If user stayed for the full duration (allow 1 min grace)
        if (minsSpent >= room.duration - 1) {
          // Award XP: 1 XP per min
          const xpToAdd = Math.round(room.duration);
          await ctx.db.patch(userId, {
            xp: (user.xp || 0) + xpToAdd,
          });
        }
      }
    }

    await ctx.db.patch(args.roomId, {
      participants: participants.filter(p => p.userId !== userId),
    });
  },
});

export const updateParticipant = mutation({
  args: {
    roomId: v.id("rooms"),
    nowPlaying: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const participants = room.participants || [];
    const participantIndex = participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) throw new Error("Not in room");

    participants[participantIndex] = {
      ...participants[participantIndex],
      nowPlaying: args.nowPlaying,
    };

    await ctx.db.patch(args.roomId, {
      participants,
    });
  },
});
