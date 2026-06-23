import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Dealership {
  id: string;
  name: string;
  email: string;
  slug: string;
}

interface AuthState {
  token: string;
  dealership: Dealership;
  provider: "local" | "cognito";
}

interface AuthContextValue {
  auth: AuthState | null;
  login: (token: string, dealership: Dealership, provider?: "local" | "cognito") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "mq_auth";

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);

  const login = useCallback((
    token: string,
    dealership: Dealership,
    provider: "local" | "cognito" = "local"
  ) => {
    const state: AuthState = { token, dealership, provider };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setAuth(state);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
