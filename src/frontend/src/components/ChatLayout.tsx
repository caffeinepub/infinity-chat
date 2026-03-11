import { Menu, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { GroupId, UserProfile } from "../backend";
import ChatWindow from "./ChatWindow";
import GroupSidebar from "./GroupSidebar";

interface ChatLayoutProps {
  userProfile: UserProfile;
}

export default function ChatLayout({ userProfile }: ChatLayoutProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<GroupId | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-0.5 gradient-bar flex-shrink-0" />

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 backdrop-blur flex-shrink-0 z-10">
        <button
          type="button"
          aria-label="Open menu"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-accent/60 transition-colors"
          onClick={() => setSidebarOpen(true)}
          data-ocid="layout.open_modal_button"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-[oklch(0.72_0.24_15)] to-[oklch(0.65_0.22_300)] bg-clip-text text-transparent">
          Infinity Chat
        </span>
      </div>

      {/* Sidebar overlay */}
      <GroupSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(id) => {
          setSelectedGroupId(id);
          setSidebarOpen(false);
        }}
        userProfile={userProfile}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {selectedGroupId ? (
          <ChatWindow groupId={selectedGroupId} />
        ) : (
          <EmptyState onOpen={() => setSidebarOpen(true)} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8"
    >
      <div className="w-20 h-20 rounded-3xl message-bubble-own flex items-center justify-center">
        <MessageCircle className="w-10 h-10 text-white" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-semibold text-lg">Select a conversation</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Open the{" "}
          <button
            type="button"
            onClick={onOpen}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            menu
          </button>{" "}
          to choose or create a group
        </p>
      </div>
    </motion.div>
  );
}
