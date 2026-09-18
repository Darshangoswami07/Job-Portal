import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { socialUploadMiddleware } from "../middlewares/socialUpload.js";
import {
  getFeed,
  getPost,
  createPost,
  updatePost,
  deletePost,
  togglePin,
  registerView,
  getUserPosts,
  toggleBookmark,
  getBookmarks,
  sharePost,
  getTrending,
  getHashtagPosts,
  followHashtag,
  votePoll,
  getPublicProfile,
} from "../controllers_new/socialController.js";
import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  getCommentReplies,
} from "../controllers_new/socialCommentController.js";
import {
  togglePostReaction,
  toggleCommentReaction,
  getPostReactions,
} from "../controllers_new/socialReactionController.js";
import {
  toggleFollow,
  sendConnectionRequest,
  respondConnectionRequest,
  removeConnection,
  getPendingRequests,
  getFollowers,
  getFollowing,
  getConnections,
  getNetworkStatus,
  getSuggestedConnections,
  toggleMute,
  getMutedUsers,
} from "../controllers_new/socialNetworkController.js";
import {
  aiAssistPost,
  getSuggestedHashtags,
} from "../controllers_new/socialAiController.js";
import { globalSearch } from "../controllers_new/socialSearchController.js";
import {
  report,
  canModerate,
  getReports,
  resolveReport,
  getModerationQueue,
  moderatePost,
  blockUser,
  getAdminAnalytics,
} from "../controllers_new/socialModerationController.js";

const router = express.Router();

router.route("/feed").get(isAuthenticated, getFeed);
router.route("/trending").get(isAuthenticated, getTrending);
router.route("/bookmarks").get(isAuthenticated, getBookmarks);
router.route("/search").get(isAuthenticated, globalSearch);
router.route("/hashtag/:tag").get(isAuthenticated, getHashtagPosts);
router.route("/hashtag/:tag/follow").post(isAuthenticated, followHashtag);
router.route("/ai/suggest-hashtags").get(isAuthenticated, getSuggestedHashtags);
router.route("/ai/assist").post(isAuthenticated, aiAssistPost);
router.route("/user/:userId/posts").get(isAuthenticated, getUserPosts);
router.route("/people/:userId").get(isAuthenticated, getPublicProfile);

router.route("/posts").post(isAuthenticated, socialUploadMiddleware, createPost);
router.route("/posts/:id").get(isAuthenticated, getPost);
router.route("/posts/:id").put(isAuthenticated, updatePost);
router.route("/posts/:id").delete(isAuthenticated, deletePost);
router.route("/posts/:id/pin").patch(isAuthenticated, togglePin);
router.route("/posts/:id/view").post(isAuthenticated, registerView);
router.route("/posts/:id/bookmark").post(isAuthenticated, toggleBookmark);
router.route("/posts/:id/share").post(isAuthenticated, sharePost);
router.route("/posts/:id/reactions").post(isAuthenticated, togglePostReaction);
router.route("/posts/:id/reactions").get(isAuthenticated, getPostReactions);
router.route("/posts/:id/vote").post(isAuthenticated, votePoll);

router.route("/posts/:postId/comments").get(isAuthenticated, getComments);
router.route("/posts/:postId/comments").post(isAuthenticated, socialUploadMiddleware, addComment);
router.route("/comments/:id").patch(isAuthenticated, updateComment);
router.route("/comments/:id").delete(isAuthenticated, deleteComment);
router.route("/comments/:id/replies").get(isAuthenticated, getCommentReplies);
router.route("/comments/:id/reactions").post(isAuthenticated, toggleCommentReaction);

router.route("/follow/:userId").post(isAuthenticated, toggleFollow);
router.route("/connect/:userId").post(isAuthenticated, sendConnectionRequest);
router.route("/connections/:id/respond").post(isAuthenticated, respondConnectionRequest);
router.route("/connections/:userId/remove").delete(isAuthenticated, removeConnection);
router.route("/requests").get(isAuthenticated, getPendingRequests);
router.route("/followers/:userId").get(isAuthenticated, getFollowers);
router.route("/following/:userId").get(isAuthenticated, getFollowing);
router.route("/connections/:userId").get(isAuthenticated, getConnections);
router.route("/network/status/:userId").get(isAuthenticated, getNetworkStatus);
router.route("/suggested").get(isAuthenticated, getSuggestedConnections);
router.route("/mute/:userId").post(isAuthenticated, toggleMute);
router.route("/muted").get(isAuthenticated, getMutedUsers);

router.route("/report").post(isAuthenticated, report);

router.route("/admin/analytics").get(isAuthenticated, canModerate, getAdminAnalytics);
router.route("/admin/reports").get(isAuthenticated, canModerate, getReports);
router.route("/admin/reports/:id/resolve").patch(isAuthenticated, canModerate, resolveReport);
router.route("/admin/moderation").get(isAuthenticated, canModerate, getModerationQueue);
router.route("/admin/posts/:id/moderate").patch(isAuthenticated, canModerate, moderatePost);
router.route("/admin/block/:userId").post(isAuthenticated, canModerate, blockUser);

export default router;