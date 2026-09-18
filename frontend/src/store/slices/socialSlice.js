import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  posts: [],
  page: 1,
  hasMore: true,
  loading: false,
  refreshing: false,
  feedKey: "feed",
  postsById: {},
  comments: {},
  commentsPage: {},
  commentsHasMore: {},
  commentsLoading: {},
  socketConnected: false,
  socialUnread: 0,
  lightbox: null,
};

const socialSlice = createSlice({
  name: "social",
  initialState,
  reducers: {
    setPosts(state, action) {
      state.posts = action.payload;
    },
    appendPosts(state, action) {
      const existing = new Set(state.posts.map((p) => String(p.id || p._id)));
      const fresh = action.payload.filter((p) => !existing.has(String(p.id || p._id)));
      state.posts = [...state.posts, ...fresh];
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    setHasMore(state, action) {
      state.hasMore = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setRefreshing(state, action) {
      state.refreshing = action.payload;
    },
    setFeedKey(state, action) {
      state.feedKey = action.payload;
    },
    upsertPost(state, action) {
      const incoming = action.payload;
      const id = String(incoming.id || incoming._id);
      state.postsById[id] = incoming;
      const idx = state.posts.findIndex((p) => String(p.id || p._id) === id);
      if (idx >= 0) {
        state.posts[idx] = { ...state.posts[idx], ...incoming };
      } else {
        state.posts = [incoming, ...state.posts];
      }
    },
    prependPosts(state, action) {
      const existing = new Set(state.posts.map((p) => String(p.id || p._id)));
      const fresh = action.payload.filter((p) => !existing.has(String(p.id || p._id)));
      state.posts = [...fresh, ...state.posts];
    },
    removePost(state, action) {
      const id = action.payload;
      state.posts = state.posts.filter((p) => String(p.id || p._id) !== String(id));
      delete state.postsById[id];
    },
    applyReaction(state, action) {
      const { postId, type, counts, reaction } = action.payload;
      const id = String(postId);
      const patch = (p) => {
        if (!p) return p;
        const next = { ...p, myReaction: reaction ? type : null };
        if (counts) next.reactionCounts = { ...(p.reactionCounts || {}), ...counts };
        return next;
      };
      state.posts = state.posts.map((p) => (String(p.id || p._id) === id ? patch(p) : p));
      if (state.postsById[id]) state.postsById[id] = patch(state.postsById[id]);
    },
    setCommentCount(state, action) {
      const { postId, count } = action.payload;
      const id = String(postId);
      const patch = (p) => (p ? { ...p, commentCount: count } : p);
      state.posts = state.posts.map((p) => (String(p.id || p._id) === id ? patch(p) : p));
      if (state.postsById[id]) state.postsById[id] = patch(state.postsById[id]);
    },
    setComments(state, action) {
      const { postId, comments, page, hasMore, total } = action.payload;
      state.comments[postId] = comments;
      state.commentsPage[postId] = page;
      state.commentsHasMore[postId] = hasMore;
      state.commentsTotal = total;
    },
    appendComments(state, action) {
      const { postId, comments, page, hasMore } = action.payload;
      const existing = state.comments[postId] || [];
      state.comments[postId] = [...existing, ...comments];
      state.commentsPage[postId] = page;
      state.commentsHasMore[postId] = hasMore;
    },
    addCommentToState(state, action) {
      const { postId, comment } = action.payload;
      const list = state.comments[postId] || [];
      if (list.some((c) => String(c.id || c._id) === String(comment.id || comment._id))) return;
      if (comment.parent) {
        const root = comment.parent;
        state.comments[postId] = list.map((c) =>
          String(c.id || c._id) === String(root) ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c
        );
      } else {
        state.comments[postId] = [...list, comment];
      }
    },
    setCommentLoading(state, action) {
      const { postId, loading } = action.payload;
      state.commentsLoading[postId] = loading;
    },
    updateCommentInState(state, action) {
      const { postId, comment } = action.payload;
      const id = String(comment.id || comment._id);
      state.comments[postId] = (state.comments[postId] || []).map((c) =>
        String(c.id || c._id) === id ? { ...c, ...comment } : c
      );
    },
    removeCommentFromState(state, action) {
      const { postId, commentId } = action.payload;
      state.comments[postId] = (state.comments[postId] || []).filter(
        (c) => String(c.id || c._id) !== String(commentId) && String(c.parent) !== String(commentId)
      );
    },
    setReplies(state, action) {
      const { commentId, replies } = action.payload;
      state.replies = { ...(state.replies || {}), [commentId]: replies };
    },
    setSocketConnected(state, action) {
      state.socketConnected = action.payload;
    },
    setSocialUnread(state, action) {
      state.socialUnread = action.payload;
    },
    setLightbox(state, action) {
      state.lightbox = action.payload;
    },
    resetSocial(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setPosts,
  appendPosts,
  setPage,
  setHasMore,
  setLoading,
  setRefreshing,
  setFeedKey,
  upsertPost,
  prependPosts,
  removePost,
  applyReaction,
  setCommentCount,
  setComments,
  appendComments,
  addCommentToState,
  setCommentLoading,
  updateCommentInState,
  removeCommentFromState,
  setReplies,
  setSocketConnected,
  setSocialUnread,
  setLightbox,
  resetSocial,
} = socialSlice.actions;

export default socialSlice.reducer;