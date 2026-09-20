import { SocialFollow } from "../models_new/SocialFollow.js";
import { SocialConnection } from "../models_new/SocialConnection.js";
import { SocialMute } from "../models_new/SocialMute.js";
import { User } from "../models/user.model.js";
import { createNotification } from "../services/socialService.js";
import { emitToSocialUser } from "../services/socialSocket.js";

const USER_SELECT = "fullname currentRole profile.profilePhoto profile.headline profile.companyName profile.verificationStatus";

export const toggleFollow = async (req, res) => {
  try {
    const userId = req.id;
    const targetId = req.params.userId;
    if (String(userId) === String(targetId)) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself." });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: "User not found." });

    const existing = await SocialFollow.findOne({ follower: userId, following: targetId });
    let followed;
    if (existing) {
      await existing.deleteOne();
      followed = false;
    } else {
      await SocialFollow.create({ follower: userId, following: targetId });
      followed = true;
      const actor = await User.findById(userId).select("fullname profile.profilePhoto").lean();
      createNotification({
        user: targetId,
        type: "system",
        title: `${actor?.fullname || "Someone"} started following you`,
        link: `/feed`,
      });
      emitToSocialUser(String(targetId), "social:follow", {
        userId: String(userId),
        followingId: String(targetId),
        followed: true,
      });
    }

    const followerCount = await SocialFollow.countDocuments({ following: targetId });
    return res.json({ success: true, followed, followerCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendConnectionRequest = async (req, res) => {
  try {
    const userId = req.id;
    const recipientId = req.params.userId;
    const { message = "" } = req.body;
    if (String(userId) === String(recipientId)) {
      return res.status(400).json({ success: false, message: "You cannot connect with yourself." });
    }

    const existing = await SocialConnection.findOne({ requester: userId, recipient: recipientId });
    if (existing) {
      if (existing.status === "pending") return res.json({ success: true, status: "pending", message: "Request already pending." });
      if (existing.status === "accepted") return res.json({ success: true, status: "accepted", message: "Already connected." });
      existing.status = "pending";
      existing.message = String(message || "").slice(0, 500);
      await existing.save();
      return res.json({ success: true, status: "pending", message: "Request sent." });
    }

    const reverse = await SocialConnection.findOne({ requester: recipientId, recipient: userId });
    if (reverse && reverse.status === "pending") {
      reverse.status = "accepted";
      reverse.connectedAt = new Date();
      await reverse.save();
      const [f1, f2] = await Promise.all([
        SocialFollow.create({ follower: userId, following: recipientId }),
        SocialFollow.create({ follower: recipientId, following: userId }),
      ]);
      return res.json({ success: true, status: "accepted", message: "Mutual connect established." });
    }

    await SocialConnection.create({ requester: userId, recipient: recipientId, message: String(message || "").slice(0, 500) });
    const actor = await User.findById(userId).select("fullname profile.profilePhoto profile.headline").lean();
    createNotification({
      user: recipientId,
      type: "system",
      title: `${actor?.fullname || "Someone"} sent you a connection request`,
      message: message ? String(message).slice(0, 90) : "Connect to start networking",
      link: "/feed/network",
    });
    emitToSocialUser(String(recipientId), "social:connection_request", {
      from: String(userId),
      actor: actor,
    });
    return res.json({ success: true, status: "pending", message: "Connection request sent." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const respondConnectionRequest = async (req, res) => {
  try {
    const userId = req.id;
    const requestId = req.params.id;
    const { action } = req.body;
    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action." });
    }

    const request = await SocialConnection.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: "Request not found." });
    if (String(request.recipient) !== String(userId)) {
      return res.status(403).json({ success: false, message: "You cannot respond to this request." });
    }
    if (request.status !== "pending") {
      return res.json({ success: true, status: request.status, message: "Request already handled." });
    }

    if (action === "accept") {
      request.status = "accepted";
      request.connectedAt = new Date();
      await request.save();
      await Promise.all([
        SocialFollow.create({ follower: userId, following: request.requester }),
        SocialFollow.create({ follower: request.requester, following: userId }),
      ]);
      const actor = await User.findById(recipientIdOr(userId)).select("fullname profile.profilePhoto").lean();
      createNotification({
        user: request.requester,
        type: "system",
        title: `${actor?.fullname || "Someone"} accepted your connection request`,
        link: "/feed/network",
      });
    } else {
      request.status = "declined";
      await request.save();
    }

    return res.json({ success: true, status: request.status, message: action === "accept" ? "Connected!" : "Request declined." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const recipientIdOr = (userId) => userId;

export const removeConnection = async (req, res) => {
  try {
    const userId = req.id;
    const targetId = req.params.userId;
    const conn = await SocialConnection.findOneAndDelete({
      status: "accepted",
      $or: [
        { requester: userId, recipient: targetId },
        { requester: targetId, recipient: userId },
      ],
    });
    await SocialFollow.deleteMany({
      $or: [
        { follower: userId, following: targetId },
        { follower: targetId, following: userId },
      ],
    });
    return res.json({ success: true, removed: Boolean(conn), message: "Connection removed." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await SocialConnection.find({ recipient: req.id, status: "pending" })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({ path: "requester", select: USER_SELECT })
      .lean();
    return res.json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await SocialFollow.find({ following: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate({ path: "follower", select: USER_SELECT })
      .lean();
    return res.json({ success: true, users: followers.map((f) => f.follower).filter(Boolean) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await SocialFollow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate({ path: "following", select: USER_SELECT })
      .lean();
    return res.json({ success: true, users: following.map((f) => f.following).filter(Boolean) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const conns = await SocialConnection.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .sort({ updatedAt: -1 })
      .limit(200)
      .populate({ path: "requester", select: USER_SELECT })
      .populate({ path: "recipient", select: USER_SELECT })
      .lean();
    const users = conns.map((c) =>
      String(c.requester?._id) === String(userId) ? c.recipient : c.requester
    ).filter(Boolean);
    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNetworkStatus = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const userId = req.id;
    const [follow, connection, pending] = await Promise.all([
      SocialFollow.findOne({ follower: userId, following: targetId }).lean(),
      SocialConnection.findOne({
        $or: [
          { requester: userId, recipient: targetId },
          { requester: targetId, recipient: userId },
        ],
      }).lean(),
      SocialConnection.findOne({ requester: userId, recipient: targetId, status: "pending" }).lean(),
    ]);
    const [followerCount, followingCount, connectionCount, isMuted] = await Promise.all([
      SocialFollow.countDocuments({ following: targetId }),
      SocialFollow.countDocuments({ follower: targetId }),
      SocialConnection.countDocuments({ status: "accepted", $or: [{ requester: targetId }, { recipient: targetId }] }),
      SocialMute.exists({ user: userId, muted: targetId }),
    ]);
    return res.json({
      success: true,
      status: {
        isFollowing: Boolean(follow),
        isFollower: Boolean(await SocialFollow.findOne({ follower: targetId, following: userId })),
        connectionStatus: connection?.status || "none",
        hasPendingRequest: connection?.status === "pending",
        isOutgoing: pending ? true : connection?.status === "pending" && String(connection.requester) === String(userId),
        isMuted: Boolean(isMuted),
        followerCount,
        followingCount,
        connectionCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSuggestedConnections = async (req, res) => {
  try {
    const userId = req.id;
    const { limit = 6, role } = req.query;
    const num = Math.min(20, Math.max(1, Number(limit)));

    const [following, connections, followsMe] = await Promise.all([
      SocialFollow.find({ follower: userId }).select("following").lean(),
      SocialConnection.find({
        status: "accepted",
        $or: [{ requester: userId }, { recipient: userId }],
      }).lean(),
      SocialFollow.find({ following: userId }).select("follower").lean(),
    ]);

    const knownIds = new Set([
      String(userId),
      ...following.map((f) => String(f.following)),
      ...connections.map((c) => String(c.requester === userId ? c.recipient : c.requester)),
      ...followsMe.map((f) => String(f.follower)),
    ]);

    const query = { _id: { $nin: [...knownIds] }, profileCompleted: true };
    if (role === "recruiter" || role === "jobSeeker") query.currentRole = role;

    const suggestions = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(num)
      .select(USER_SELECT)
      .lean();

    return res.json({ success: true, users: suggestions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleMute = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (String(targetId) === String(req.id)) {
      return res.status(400).json({ success: false, message: "Cannot mute yourself." });
    }
    const existing = await SocialMute.findOne({ user: req.id, muted: targetId });
    let muted;
    if (existing) {
      await existing.deleteOne();
      muted = false;
    } else {
      await SocialMute.create({ user: req.id, muted: targetId });
      muted = true;
    }
    return res.json({ success: true, muted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMutedUsers = async (req, res) => {
  try {
    const mutes = await SocialMute.find({ user: req.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate({ path: "muted", select: USER_SELECT })
      .lean();
    return res.json({ success: true, users: mutes.map((m) => m.muted).filter(Boolean) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};