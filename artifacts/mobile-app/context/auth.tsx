import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { setAuthTokenGetter } from "@workspace/api-client-react";

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

const TOKEN_KEY = "realityos_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const fetchUser = useCallback(async (t: string): Promise<AuthUser | null> => {
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
      const resp = await fetch(`https://${domain}/api/auth/user`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data?.user ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          const u = await fetchUser(stored);
          if (u) {
            setToken(stored);
            tokenRef.current = stored;
            setUser(u);
          } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch {}
      setIsLoading(false);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
  }, []);

  const signIn = useCallback(async () => {
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";

      if (Platform.OS === "web") {
        window.location.href = `https://${domain}/api/login?returnTo=/`;
        return;
      }

      const redirectUri = `https://${domain}/api/callback-mobile`;
      const loginUrl = `https://${domain}/api/mobile-login?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(loginUrl, "mobile-app://auth");

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const tok = url.searchParams.get("token");
        if (tok) {
          await AsyncStorage.setItem(TOKEN_KEY, tok);
          setToken(tok);
          tokenRef.current = tok;
          const u = await fetchUser(tok);
          setUser(u);
        }
      }
    } catch (e) {
      console.error("Sign in error", e);
    }
  }, [fetchUser]);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
      tokenRef.current = null;
      setUser(null);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
