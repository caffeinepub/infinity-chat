import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveUserProfile } from "../hooks/useQueries";

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const { mutateAsync: saveProfile, isPending } = useSaveUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    try {
      await saveProfile({
        displayName: displayName.trim(),
        lastActive: BigInt(Date.now()) * 1_000_000n,
      });
      toast.success("Profile created!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="bg-card border border-border rounded-3xl p-8 shadow-deep">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl message-bubble-own flex items-center justify-center">
              <User className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold">Set up your profile</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Choose a display name to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Display name
              </Label>
              <Input
                id="displayName"
                data-ocid="profile.input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="bg-input border-border rounded-xl h-12 text-base px-4 focus:ring-2 focus:ring-primary/30"
                maxLength={50}
                autoFocus
              />
            </div>

            <Button
              data-ocid="profile.submit_button"
              type="submit"
              className="w-full h-12 rounded-xl message-bubble-own text-white border-0 font-semibold text-base hover:opacity-90 transition-opacity"
              disabled={!displayName.trim() || isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
