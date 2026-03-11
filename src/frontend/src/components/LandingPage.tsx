import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      if (error?.message === "User is already authenticated") {
        queryClient.clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  return (
    <div className="h-full flex items-center justify-center overflow-auto bg-background px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
          className="mb-6 w-20 h-20 rounded-3xl message-bubble-own flex items-center justify-center shadow-glow"
        >
          <MessageCircle className="w-10 h-10 text-white" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-4xl font-bold tracking-tight mb-3"
        >
          Infinity <span className="text-primary">Chat</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-muted-foreground text-base mb-10 leading-relaxed"
        >
          Smooth, instant group messaging with images, reactions, and threads.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-full"
        >
          <Button
            data-ocid="landing.primary_button"
            size="lg"
            className="w-full py-6 text-base font-semibold rounded-2xl message-bubble-own text-white shadow-glow hover:opacity-90 transition-opacity border-0"
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in to get started"
            )}
          </Button>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center text-xs text-muted-foreground"
        >
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </motion.footer>
      </motion.div>
    </div>
  );
}
