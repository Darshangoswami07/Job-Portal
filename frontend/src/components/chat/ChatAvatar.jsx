import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import OnlineStatusDot from "./OnlineStatusDot";
import { getInitials } from "@/utils/chat";
import { cn } from "@/lib/utils";

export default function ChatAvatar({
  src,
  name,
  size = "md",
  online,
  showStatus = false,
  className,
  rounded = "rounded-xl",
}) {
  const sizes = {
    xs: "h-7 w-7",
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
    xl: "h-16 w-16",
  };
  const dotSizes = { xs: "h-2 w-2", sm: "h-2.5 w-2.5", md: "h-3 w-3", lg: "h-3.5 w-3.5", xl: "h-4 w-4" };

  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <Avatar className={cn(sizes[size], rounded)}>
        <AvatarImage src={src} alt={name || "User"} />
        <AvatarFallback
          className={cn(
            rounded,
            "bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white"
          )}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <OnlineStatusDot online={Boolean(online)} className={dotSizes[size]} withPulse={false} />
        </span>
      )}
    </span>
  );
}
