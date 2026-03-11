import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus, UserPlus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Group, GroupId, UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllGroups,
  useGetUserGroups,
  useJoinGroup,
} from "../hooks/useQueries";
import { formatRelativeTime } from "../utils/timeUtils";
import CreateGroupModal from "./CreateGroupModal";

interface Props {
  open: boolean;
  onClose: () => void;
  selectedGroupId: GroupId | null;
  onSelectGroup: (id: GroupId) => void;
  userProfile: UserProfile;
}

function getGroupLastMessage(group: Group) {
  if (!group.messages || group.messages.length === 0) return null;
  return group.messages.reduce((latest, msg) =>
    msg.timestamp > latest.timestamp ? msg : latest,
  );
}

function sortGroupsByRecent(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => {
    const aMsg = getGroupLastMessage(a);
    const bMsg = getGroupLastMessage(b);
    if (!aMsg && !bMsg) return 0;
    if (!aMsg) return 1;
    if (!bMsg) return -1;
    return Number(bMsg.timestamp - aMsg.timestamp);
  });
}

export default function GroupSidebar({
  open,
  onClose,
  selectedGroupId,
  onSelectGroup,
  userProfile,
}: Props) {
  const { data: myGroups, isLoading } = useGetUserGroups();
  const { data: allGroups } = useGetAllGroups();
  const joinGroup = useJoinGroup();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const myGroupIds = new Set((myGroups ?? []).map((g) => g.id));
  const sortedMyGroups = myGroups ? sortGroupsByRecent(myGroups) : [];
  const discoverableGroups = (allGroups ?? []).filter(
    (g) => !myGroupIds.has(g.id),
  );

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleJoin = async (groupId: GroupId) => {
    await joinGroup.mutateAsync(groupId);
    onSelectGroup(groupId);
    onClose();
  };

  return (
    <>
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
              className="fixed top-0 left-0 h-full w-80 bg-sidebar border-r border-sidebar-border flex flex-col z-50 shadow-deep"
            >
              {/* Header */}
              <div className="px-4 pt-5 pb-3 flex items-center justify-between border-b border-sidebar-border">
                <h1 className="text-xl font-bold tracking-tight">Messages</h1>
                <div className="flex items-center gap-1">
                  <Button
                    data-ocid="sidebar.open_modal_button"
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 rounded-xl hover:bg-primary/15 hover:text-primary transition-colors"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 rounded-xl hover:bg-accent/60 transition-colors"
                    onClick={onClose}
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Group list */}
              <ScrollArea className="flex-1 scrollbar-thin">
                <div className="py-2">
                  {isLoading ? (
                    <div
                      className="px-3 space-y-1"
                      data-ocid="sidebar.loading_state"
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3 py-3"
                        >
                          <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0 bg-muted" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-28 bg-muted" />
                            <Skeleton className="h-3 w-40 bg-muted" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* My Groups */}
                      {sortedMyGroups.length > 0 && (
                        <>
                          <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Your Groups
                          </p>
                          <AnimatePresence initial={false}>
                            {sortedMyGroups.map((group, idx) => {
                              const lastMsg = getGroupLastMessage(group);
                              const isSelected = selectedGroupId === group.id;
                              return (
                                <motion.button
                                  key={group.id}
                                  data-ocid={`sidebar.item.${idx + 1}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.04 }}
                                  onClick={() => {
                                    onSelectGroup(group.id);
                                    onClose();
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 mx-1 py-3 rounded-2xl transition-all duration-150 cursor-pointer text-left ${
                                    isSelected
                                      ? "bg-primary/15 text-foreground"
                                      : "hover:bg-accent/50 text-foreground"
                                  }`}
                                >
                                  <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                                      isSelected
                                        ? "message-bubble-own text-white"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {group.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-sm truncate">
                                        {group.name}
                                      </span>
                                      {lastMsg && (
                                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                          {formatRelativeTime(
                                            lastMsg.timestamp,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                      {lastMsg
                                        ? lastMsg.content
                                        : "No messages yet"}
                                    </p>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </AnimatePresence>
                        </>
                      )}

                      {/* Discoverable groups */}
                      {discoverableGroups.length > 0 && (
                        <>
                          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Discover Groups
                          </p>
                          <AnimatePresence initial={false}>
                            {discoverableGroups.map((group, idx) => (
                              <motion.div
                                key={group.id}
                                data-ocid={`sidebar.discover.item.${idx + 1}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="flex items-center gap-3 px-3 mx-1 py-3 rounded-2xl hover:bg-accent/30 transition-all duration-150"
                              >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold bg-muted text-muted-foreground">
                                  {group.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-sm truncate block">
                                    {group.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {group.members.length} member
                                    {group.members.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                <Button
                                  data-ocid={`sidebar.join.button.${idx + 1}`}
                                  size="sm"
                                  variant="outline"
                                  className="flex-shrink-0 text-xs h-8 px-3 rounded-xl"
                                  onClick={() => handleJoin(group.id)}
                                  disabled={joinGroup.isPending}
                                >
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  Join
                                </Button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </>
                      )}

                      {/* Empty state */}
                      {sortedMyGroups.length === 0 &&
                        discoverableGroups.length === 0 && (
                          <div
                            data-ocid="sidebar.empty_state"
                            className="px-6 py-12 text-center"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                              <Plus className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium">No groups yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Create one to start chatting
                            </p>
                          </div>
                        )}
                    </>
                  )}
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
                    size="icon"
                    className="w-8 h-8 rounded-xl hover:bg-destructive/15 hover:text-destructive transition-colors flex-shrink-0"
                    onClick={handleLogout}
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateGroupModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
