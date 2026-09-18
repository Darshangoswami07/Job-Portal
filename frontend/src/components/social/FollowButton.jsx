import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, UserCheck, Check, X, Loader2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { fetchNetworkStatus, toggleFollow, sendConnectionRequest, removeConnection } from "@/api/socialApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function FollowButton({ userId, viewerId, className, size = "sm", variant = "outline" }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || String(userId) === String(viewerId)) return;
    let mounted = true;
    fetchNetworkStatus(userId)
      .then((res) => {
        if (mounted && res.data?.success) setStatus(res.data.status);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [userId, viewerId]);

  const act = useCallback(async (action) => {
    setLoading(true);
    try {
      if (action === "follow") {
        const res = await toggleFollow(userId);
        setStatus((s) => ({ ...s, isFollowing: res.data.followed, followerCount: res.data.followerCount }));
        toast.success(res.data.followed ? "Following" : "Unfollowed");
      } else if (action === "connect") {
        const res = await sendConnectionRequest(userId);
        setStatus((s) => ({ ...s, connectionStatus: res.data.status }));
        toast.success(res.data.message);
      } else if (action === "remove") {
        await removeConnection(userId);
        setStatus((s) => ({ ...s, connectionStatus: "none", isFollowing: false }));
        toast.success("Connection removed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  if (!userId || String(userId) === String(viewerId)) return null;

  const isConnected = status?.connectionStatus === "accepted";

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size={size}
        variant={isConnected ? "ghost" : status?.connectionStatus === "pending" ? "ghost" : "outline"}
        onClick={() => {
          if (isConnected) act("remove");
          else if (status?.connectionStatus === "pending") {
            toast.info("Request pending");
          } else act("connect");
        }}
        disabled={loading}
        className={cn(
          "rounded-xl font-semibold",
          isConnected && "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10",
          status?.connectionStatus === "pending" && "border-amber-200 text-amber-600 dark:border-amber-500/30",
          className
        )}
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : isConnected ? <Check className="size-3.5" /> : status?.connectionStatus === "pending" ? <X className="size-3.5" /> : <UserPlus className="size-3.5" />}
        {isConnected ? "Connected" : status?.connectionStatus === "pending" ? "Pending" : status?.isFollowing ? "Following" : "Connect"}
      </Button>

      <Button
        size={size}
        variant="ghost"
        onClick={() => navigate("/chat")}
        className="rounded-xl"
        aria-label="Message"
      >
        <MessageSquare className="size-3.5" />
      </Button>
    </div>
  );
}