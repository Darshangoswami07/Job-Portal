import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { connectSocket, getSocket, disconnectSocket } from "@/utils/socket";
import {
  setSocketConnected,
  upsertPost,
  applyReaction,
  addCommentToState,
  setSocialUnread,
} from "@/store/slices/socialSlice";

export default function useSocialSocket() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const token = useSelector((s) => s.auth.token);
  const feedKey = useSelector((s) => s.social.feedKey);

  useEffect(() => {
    if (!user || !token) return;
    const socket = connectSocket(token);
    const userId = String(user._id);
    dispatch(setSocketConnected(socket.connected));

    const handleConnect = () => dispatch(setSocketConnected(true));
    const handleDisconnect = () => dispatch(setSocketConnected(false));

    const handleNewPost = (payload) => {
      if (payload?.actorId && String(payload.actorId) === userId) return;
      if (payload?.post) {
        dispatch(upsertPost(payload.post));
      }
    };

    const handleReaction = (payload) => {
      if (payload?.userId && String(payload.userId) === userId) return;
      if (feedKey === "feed" && payload?.postId) {
        dispatch(applyReaction({ postId: payload.postId, type: payload.type, reaction: { type: payload.type } }));
      }
    };

    const handleComment = (payload) => {
      if (payload?.comment?.author?._id && String(payload.comment.author._id) === userId) return;
      if (payload?.postId && payload?.comment) {
        dispatch(addCommentToState({ postId: payload.postId, comment: payload.comment }));
      }
    };

    const handleNotification = (notification) => {
      dispatch(setSocialUnread((notification?.isRead ? 0 : 1)));
    };

    const handleFollow = (payload) => {
      if (payload?.userId && String(payload.userId) === userId) return;
      toast.info("New follower", {
        description: "Someone started following you",
        action: { label: "View", onClick: () => { window.location.href = "/feed/network"; } },
      });
    };

    const handleConnectionRequest = (payload) => {
      if (payload?.from && String(payload.from) === userId) return;
      const name = payload?.actor?.fullname || "Someone";
      toast.info(`${name} sent you a connection request`, {
        action: { label: "View", onClick: () => { window.location.href = "/feed/network"; } },
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("social:new_post", handleNewPost);
    socket.on("social:reaction", handleReaction);
    socket.on("social:comment", handleComment);
    socket.on("social:notification", handleNotification);
    socket.on("social:follow", handleFollow);
    socket.on("social:connection_request", handleConnectionRequest);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("social:new_post", handleNewPost);
      socket.off("social:reaction", handleReaction);
      socket.off("social:comment", handleComment);
      socket.off("social:notification", handleNotification);
      socket.off("social:follow", handleFollow);
      socket.off("social:connection_request", handleConnectionRequest);
    };
  }, [user, token, dispatch, feedKey]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
    }
  }, [user]);

  return null;
}