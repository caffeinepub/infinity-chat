import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import type { GroupId, UserProfile } from "../backend";
import { useActor } from "../hooks/useActor";

const PRESET_CHANNELS = [
  {
    id: "general",
    name: "General",
    emoji: "💬",
    description: "Chat about anything",
  },
  {
    id: "memes",
    name: "Memes",
    emoji: "😂",
    description: "Share the funniest stuff",
  },
  { id: "vibes", name: "Vibes", emoji: "✨", description: "Good vibes only" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  selectedGroupId: GroupId | null;
  onSelectGroup: (id: GroupId) => void;
  userProfile: UserProfile;
}

export default function GroupSidebar({
  open,
  onClose,
  selectedGroupId,
  onSelectGroup,
  userProfile,
}: Props) {
  const { actor } = useActor();
  const joinedRef = useRef(false);

  // Auto-join all preset channels once actor is ready
  useEffect(() => {
    if (!actor || joinedRef.current) return;
    joinedRef.current = true;
    // Fire-and-forget join for each channel — backend is idempotent
    for (const channel of PRESET_CHANNELS) {
      actor.joinGroup(channel.id).catch(() => {
        // Channel does not exist yet — create it using channel.id as the name
        // so the backend assigns groupId === channel.id, then join
        actor
          .createGroup(channel.id)
          .then(() => actor.joinGroup(channel.id))
          .catch(() => {
            /* ignore */
          });
      });
    }
  }, [actor]);

  const handleSelect = useCallback(
    (id: GroupId) => {
      onSelectGroup(id);
      onClose();
    },
    [onSelectGroup, onClose],
  );

  const handleChangeName = () => {
    localStorage.removeItem("infinity_chat_display_name");
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.div
            key="sidebar"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-50 shadow-deep"
          >
            {/* Header */}
            <div className="px-4 pt-5 pb-3 flex items-center justify-between border-b border-sidebar-border">
              <h1 className="text-xl font-bold tracking-tight">Channels</h1>
              <Button
                size="icon"
                variant="ghost"
                className="w-9 h-9 rounded-xl hover:bg-accent/60 transition-colors"
                onClick={onClose}
                aria-label="Close menu"
                data-ocid="sidebar.close_button"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Channel list */}
            <ScrollArea className="flex-1 scrollbar-thin">
              <div className="py-3 px-2">
                <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Public Channels
                </p>
                {PRESET_CHANNELS.map((channel, idx) => {
                  const isSelected = selectedGroupId === channel.id;
                  return (
                    <motion.button
                      key={channel.id}
                      data-ocid={`sidebar.item.${idx + 1}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSelect(channel.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-150 cursor-pointer text-left mb-1 ${
                        isSelected
                          ? "bg-primary/15 text-foreground"
                          : "hover:bg-accent/50 text-foreground"
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${
                          isSelected ? "message-bubble-own" : "bg-muted"
                        }`}
                      >
                        {channel.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">#{channel.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {channel.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* User profile at bottom */}
            <div className="px-4 py-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 rounded-xl">
                  <AvatarFallback className="rounded-xl message-bubble-own text-white text-sm font-semibold">
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {userProfile.displayName}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
                <Button
                  data-ocid="sidebar.secondary_button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-3 rounded-xl hover:bg-accent/60 transition-colors flex-shrink-0"
                  onClick={handleChangeName}
                  title="Change name"
                >
                  Change
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
