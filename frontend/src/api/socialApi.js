import axios from "axios";
import { SOCIAL_API_END_POINT } from "@/utils/constant";

const base = SOCIAL_API_END_POINT;

// ---------- Posts ----------
export const fetchFeed = (params) => axios.get(`${base}/feed`, { params, withCredentials: true });
export const fetchPost = (id) => axios.get(`${base}/posts/${id}`, { withCredentials: true });
export const createPost = (payload) => axios.post(`${base}/posts`, payload, { withCredentials: true });
export const updatePost = (id, payload) => axios.put(`${base}/posts/${id}`, payload, { withCredentials: true });
export const deletePost = (id) => axios.delete(`${base}/posts/${id}`, { withCredentials: true });
export const togglePinPost = (id) => axios.patch(`${base}/posts/${id}/pin`, {}, { withCredentials: true });
export const registerPostView = (id) => axios.post(`${base}/posts/${id}/view`, {}, { withCredentials: true });
export const fetchUserPosts = (userId, params) => axios.get(`${base}/user/${userId}/posts`, { params, withCredentials: true });
export const fetchPublicProfile = (userId) => axios.get(`${base}/people/${userId}`, { withCredentials: true });

// ---------- Reactions ----------
export const togglePostReaction = (id, type) => axios.post(`${base}/posts/${id}/reactions`, { type }, { withCredentials: true });
export const getPostReactions = (id) => axios.get(`${base}/posts/${id}/reactions`, { withCredentials: true });
export const toggleCommentReaction = (id, type) => axios.post(`${base}/comments/${id}/reactions`, { type }, { withCredentials: true });

// ---------- Comments ----------
export const fetchComments = (postId, params) => axios.get(`${base}/posts/${postId}/comments`, { params, withCredentials: true });
export const addComment = (postId, payload) => axios.post(`${base}/posts/${postId}/comments`, payload, { withCredentials: true });
export const updateComment = (id, content) => axios.patch(`${base}/comments/${id}`, { content }, { withCredentials: true });
export const deleteComment = (id) => axios.delete(`${base}/comments/${id}`, { withCredentials: true });
export const fetchCommentReplies = (id) => axios.get(`${base}/comments/${id}/replies`, { withCredentials: true });

// ---------- Bookmarks / share ----------
export const toggleBookmark = (id, collection) => axios.post(`${base}/posts/${id}/bookmark`, { collection }, { withCredentials: true });
export const fetchBookmarks = (params) => axios.get(`${base}/bookmarks`, { params, withCredentials: true });
export const sharePost = (id, payload) => axios.post(`${base}/posts/${id}/share`, payload, { withCredentials: true });
export const votePoll = (id, optionId) => axios.post(`${base}/posts/${id}/vote`, { optionId }, { withCredentials: true });

// ---------- Network ----------
export const toggleFollow = (userId) => axios.post(`${base}/follow/${userId}`, {}, { withCredentials: true });
export const sendConnectionRequest = (userId, message) => axios.post(`${base}/connect/${userId}`, { message }, { withCredentials: true });
export const respondConnectionRequest = (id, action) => axios.post(`${base}/connections/${id}/respond`, { action }, { withCredentials: true });
export const removeConnection = (userId) => axios.delete(`${base}/connections/${userId}/remove`, { withCredentials: true });
export const fetchPendingRequests = () => axios.get(`${base}/requests`, { withCredentials: true });
export const fetchNetworkStatus = (userId) => axios.get(`${base}/network/status/${userId}`, { withCredentials: true });
export const fetchFollowers = (userId) => axios.get(`${base}/followers/${userId}`, { withCredentials: true });
export const fetchFollowing = (userId) => axios.get(`${base}/following/${userId}`, { withCredentials: true });
export const fetchConnections = (userId) => axios.get(`${base}/connections/${userId}`, { withCredentials: true });
export const fetchSuggested = (params) => axios.get(`${base}/suggested`, { params, withCredentials: true });
export const toggleMute = (userId) => axios.post(`${base}/mute/${userId}`, {}, { withCredentials: true });
export const fetchMuted = () => axios.get(`${base}/muted`, { withCredentials: true });

// ---------- Discovery / AI ----------
export const fetchTrending = () => axios.get(`${base}/trending`, { withCredentials: true });
export const globalSearch = (params) => axios.get(`${base}/search`, { params, withCredentials: true });
export const fetchHashtagPosts = (tag, params) => axios.get(`${base}/hashtag/${tag}`, { params, withCredentials: true });
export const followHashtag = (tag) => axios.post(`${base}/hashtag/${tag}/follow`, {}, { withCredentials: true });
export const aiAssist = (payload) => axios.post(`${base}/ai/assist`, payload, { withCredentials: true });
export const fetchSuggestedHashtags = () => axios.get(`${base}/ai/suggest-hashtags`, { withCredentials: true });

// ---------- Moderation / Reports ----------
export const reportTarget = (payload) => axios.post(`${base}/report`, payload, { withCredentials: true });
export const fetchAdminAnalytics = () => axios.get(`${base}/admin/analytics`, { withCredentials: true });
export const fetchReports = (params) => axios.get(`${base}/admin/reports`, { params, withCredentials: true });
export const resolveReport = (id, payload) => axios.patch(`${base}/admin/reports/${id}/resolve`, payload, { withCredentials: true });
export const fetchModerationQueue = (params) => axios.get(`${base}/admin/moderation`, { params, withCredentials: true });
export const moderatePost = (id, payload) => axios.patch(`${base}/admin/posts/${id}/moderate`, payload, { withCredentials: true });