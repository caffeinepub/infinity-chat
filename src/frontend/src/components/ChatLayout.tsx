import { Menu, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { GroupId, UserProfile } from "../backend";
import ChatWindow from "./ChatWindow";
import GroupSidebar from "./GroupSidebar";

const DEFAULT_CHANNEL = "general";

interface ChatLayoutProps {
  userProfile: UserProfile;
}

export default function ChatLayout({ userProfile }: ChatLayoutProps) {
  const [selectedGroupId, setSelectedGroupId] =
    useState<GroupId>(DEFAULT_CHANNEL);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-0.5 gradient-bar flex-shrink-0" />

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
          <ChatWindow
            groupId={selectedGroupId}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
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
        <h3 className="font-semibold text-lg">Select a channel</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Open the{" "}
          <button
            type="button"
            onClick={onOpen}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            menu
          </button>{" "}
          to choose a channel
        </p>
      </div>
    </motion.div>
  );
}
