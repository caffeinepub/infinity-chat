import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateGroup } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ open, onClose }: Props) {
  const [groupName, setGroupName] = useState("");
  const { mutateAsync: createGroup, isPending } = useCreateGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      await createGroup(groupName.trim());
      toast.success(`Group "${groupName.trim()}" created!`);
      setGroupName("");
      onClose();
    } catch {
      toast.error("Failed to create group. Please try again.");
    }
  };

  const handleClose = () => {
    setGroupName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="create-group.dialog"
        className="bg-card border-border rounded-3xl sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Create new group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium">
              Group name
            </Label>
            <Input
              id="groupName"
              data-ocid="create-group.input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Weekend Plans"
              className="bg-input border-border rounded-xl h-12 text-base px-4 focus:ring-2 focus:ring-primary/30"
              maxLength={60}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button
              data-ocid="create-group.cancel_button"
              type="button"
              variant="outline"
              className="flex-1 rounded-xl border-border hover:bg-accent"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              data-ocid="create-group.submit_button"
              type="submit"
              className="flex-1 rounded-xl message-bubble-own text-white border-0 hover:opacity-90 transition-opacity"
              disabled={!groupName.trim() || isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create group"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
