import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import ChatLayout from "./components/ChatLayout";
import LandingPage from "./components/LandingPage";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveUserProfile,
} from "./hooks/useQueries";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const { mutate: autoSaveProfile, isPending: isSavingProfile } =
    useSaveUserProfile();
  const [autoSaveAttempted, setAutoSaveAttempted] = useState(false);

  const isAuthenticated = !!identity;

  const isLoading =
    isInitializing ||
    actorFetching ||
    profileLoading ||
    isSavingProfile ||
    (isAuthenticated && !isFetched);

  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      isFetched &&
      userProfile === null &&
      !autoSaveAttempted
    ) {
      setAutoSaveAttempted(true);
      const name =
        localStorage.getItem("infinity_chat_display_name") || "Anonymous";
      autoSaveProfile({
        displayName: name,
        lastActive: BigInt(Date.now()) * 1_000_000n,
      });
    }
  }, [
    isAuthenticated,
    isLoading,
    isFetched,
    userProfile,
    autoSaveAttempted,
    autoSaveProfile,
  ]);

  const showChat =
    isAuthenticated && !isLoading && isFetched && userProfile !== null;

  return (
    <div className="h-full bg-background">
      {!isAuthenticated && !isLoading && <LandingPage />}
      {isLoading && (
        <div
          className="h-full flex items-center justify-center"
          data-ocid="app.loading_state"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">
              {isSavingProfile
                ? "Setting up your profile..."
                : "Loading your account..."}
            </p>
          </div>
        </div>
      )}
      {showChat && userProfile && <ChatLayout userProfile={userProfile} />}
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
