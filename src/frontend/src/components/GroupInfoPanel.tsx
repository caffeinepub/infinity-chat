import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Copy, LogOut, UserPlus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { GroupId } from "../backend";
import {
  useGetGroupMembers,
  useGetUserGroups,
  useGetUserProfile,
  useInviteToGroup,
  useLeaveGroup,
} from "../hooks/useQueries";

interface Props {
  groupId: GroupId;
  onClose: () => void;
}

function MemberRow({ userId }: { userId: string }) {
  const { data: profile } = useGetUserProfile(userId);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
        {profile?.displayName?.charAt(0).toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {profile?.displayName ?? "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground truncate" title={userId}>
          {userId.slice(0, 20)}...
        </p>
      </div>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        onClick={handleCopy}
        title="Copy principal ID"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

export default function GroupInfoPanel({ groupId, onClose }: Props) {
  const [inviteId, setInviteId] = useState("");

  const { data: members, isLoading: membersLoading } =
    useGetGroupMembers(groupId);
  const { data: groups } = useGetUserGroups();
  const { mutateAsync: invite, isPending: inviting } =
    useInviteToGroup(groupId);
  const { mutateAsync: leave, isPending: leaving } = useLeaveGroup(groupId);

  const group = groups?.find((g) => g.id === groupId);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteId.trim()) return;
    try {
      await invite(inviteId.trim());
      toast.success("Member invited!");
      setInviteId("");
    } catch {
      toast.error("Failed to invite. Check the Principal ID.");
    }
  };

  const handleLeave = async () => {
    try {
      await leave();
      toast.success("Left group");
      onClose();
    } catch {
      toast.error("Failed to leave group.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-[300px] h-full flex flex-col bg-card/50 p-5"
    >
      {/* Group name */}
      <div className="mb-5">
        <div className="w-14 h-14 rounded-2xl message-bubble-own flex items-center justify-center text-white text-2xl font-bold mb-3">
          {group?.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <h3 className="font-bold text-lg">{group?.name ?? "Group"}</h3>
        <p className="text-sm text-muted-foreground">
          {members?.length ?? 0} members
        </p>
      </div>

      <Separator className="mb-4 bg-border" />

      {/* Invite */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Invite member
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            data-ocid="group-info.input"
            value={inviteId}
            onChange={(e) => setInviteId(e.target.value)}
            placeholder="Principal ID..."
            className="flex-1 bg-input border-border rounded-xl h-9 text-xs px-3 focus:ring-2 focus:ring-primary/30"
          />
          <Button
            data-ocid="group-info.submit_button"
            type="submit"
            size="icon"
            className="w-9 h-9 rounded-xl message-bubble-own text-white border-0 flex-shrink-0 hover:opacity-90 transition-opacity"
            disabled={!inviteId.trim() || inviting}
          >
            {inviting ? (
              <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>

      <Separator className="mb-4 bg-border" />

      {/* Members list */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Members
        </p>
      </div>

      <ScrollArea
        className="flex-1 scrollbar-thin -mx-1 px-1"
        data-ocid="group-info.list"
      >
        {membersLoading ? (
          <div className="space-y-2" data-ocid="group-info.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="w-8 h-8 rounded-xl bg-muted" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-24 bg-muted" />
                  <Skeleton className="h-2.5 w-32 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          members?.map((member, idx) => (
            <div
              key={member.toString()}
              data-ocid={`group-info.item.${idx + 1}`}
            >
              <MemberRow userId={member.toString()} />
            </div>
          ))
        )}
      </ScrollArea>

      <Separator className="my-4 bg-border" />

      {/* Leave group */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            data-ocid="group-info.delete_button"
            variant="outline"
            className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
            disabled={leaving}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave group
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent
          data-ocid="group-info.dialog"
          className="bg-card border-border rounded-3xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You will lose access to the group chat and messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="group-info.cancel_button"
              className="rounded-xl border-border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="group-info.confirm_button"
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleLeave}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
