import { Toaster } from "@/components/ui/sonner";
import ChatLayout from "./components/ChatLayout";
import LandingPage from "./components/LandingPage";
import ProfileSetup from "./components/ProfileSetup";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

export default function App() {
  const { identity } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const isLoading = actorFetching || profileLoading;
  const showProfileSetup =
    isAuthenticated && !isLoading && isFetched && userProfile === null;
  const showChat =
    isAuthenticated && !isLoading && isFetched && userProfile !== null;

  return (
    <div className="h-full bg-background">
      {!isAuthenticated && <LandingPage />}
      {isAuthenticated && isLoading && (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">
              Loading your account...
            </p>
          </div>
        </div>
      )}
      {showProfileSetup && <ProfileSetup />}
      {showChat && userProfile && <ChatLayout userProfile={userProfile} />}
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
