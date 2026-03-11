import { Ed25519KeyIdentity } from "@dfinity/identity";
import type { Identity } from "@icp-sdk/core/agent";
import {
  type PropsWithChildren,
  type ReactNode,
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type Status =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";

export type InternetIdentityContext = {
  identity?: Identity;
  login: () => void;
  clear: () => void;
  loginStatus: Status;
  isInitializing: boolean;
  isLoginIdle: boolean;
  isLoggingIn: boolean;
  isLoginSuccess: boolean;
  isLoginError: boolean;
  loginError?: Error;
};

type ProviderValue = InternetIdentityContext;
const InternetIdentityReactContext = createContext<ProviderValue | undefined>(
  undefined,
);

function assertProviderPresent(
  context: ProviderValue | undefined,
): asserts context is ProviderValue {
  if (!context) {
    throw new Error(
      "InternetIdentityProvider is not present. Wrap your component tree with it.",
    );
  }
}

const STORAGE_KEY = "infinity_chat_identity";

function loadStoredIdentity(): Ed25519KeyIdentity | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return undefined;
    return Ed25519KeyIdentity.fromJSON(stored);
  } catch {
    return undefined;
  }
}

export const useInternetIdentity = (): InternetIdentityContext => {
  const context = useContext(InternetIdentityReactContext);
  assertProviderPresent(context);
  return context;
};

export function InternetIdentityProvider({
  children,
}: PropsWithChildren<{ children: ReactNode }>) {
  const [identity, setIdentity] = useState<Identity | undefined>(() =>
    loadStoredIdentity(),
  );
  const [loginStatus, setStatus] = useState<Status>(() =>
    loadStoredIdentity() ? "success" : "idle",
  );
  const [loginError, setLoginError] = useState<Error | undefined>(undefined);

  const login = useCallback(() => {
    try {
      setStatus("logging-in");
      const newIdentity = Ed25519KeyIdentity.generate();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity.toJSON()));
      setIdentity(newIdentity);
      setStatus("success");
    } catch (err) {
      setStatus("loginError");
      setLoginError(err instanceof Error ? err : new Error("Login failed"));
    }
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIdentity(undefined);
    setStatus("idle");
    setLoginError(undefined);
  }, []);

  const value = useMemo<ProviderValue>(
    () => ({
      identity,
      login,
      clear,
      loginStatus,
      isInitializing: false,
      isLoginIdle: loginStatus === "idle",
      isLoggingIn: loginStatus === "logging-in",
      isLoginSuccess: loginStatus === "success",
      isLoginError: loginStatus === "loginError",
      loginError,
    }),
    [identity, login, clear, loginStatus, loginError],
  );

  return createElement(InternetIdentityReactContext.Provider, {
    value,
    children,
  });
}
