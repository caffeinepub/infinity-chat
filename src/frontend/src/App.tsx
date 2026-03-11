import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import type { UserProfile } from "./backend";
import ChatLayout from "./components/ChatLayout";
import LandingPage from "./components/LandingPage";
import { useActor } from "./hooks/useActor";
import { useSaveUserProfile } from "./hooks/useQueries";

export default function App() {
  const [displayName, setDisplayName] = useState<string | null>(() =>
    localStorage.getItem("infinity_chat_display_name"),
  );

  const { actor, isFetching: actorLoading } = useActor();
  const { mutate: saveProfile } = useSaveUserProfile();
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (actor && displayName && !profileSaved) {
      setProfileSaved(true);
      saveProfile({
        displayName,
        lastActive: BigInt(Date.now()) * 1_000_000n,
      });
    }
  }, [actor, displayName, profileSaved, saveProfile]);

  const handleJoin = (name: string) => {
    localStorage.setItem("infinity_chat_display_name", name);
    setDisplayName(name);
    setProfileSaved(false);
  };

  // No display name yet — show landing immediately, no loading needed
  if (!displayName) {
    return (
      <>
        <LandingPage onJoin={handleJoin} />
        <Toaster position="bottom-right" theme="dark" />
      </>
    );
  }

  // Has display name, wait for actor to connect
  if (actorLoading) {
    return (
      <div
        className="h-full flex items-center justify-center"
        data-ocid="app.loading_state"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  const userProfile: UserProfile = {
    displayName,
    lastActive: BigInt(Date.now()) * 1_000_000n,
  };

  return (
    <div className="h-full bg-background">
      <ChatLayout userProfile={userProfile} />
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
