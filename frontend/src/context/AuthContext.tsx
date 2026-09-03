"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import authFetch, { API_BASE_URL } from "@/lib/api";
import { UserProfile } from "@/types";

interface JWTPayload {
  user_id: number;
  username?: string;
  exp: number;
  [key: string]: unknown;
}

interface AuthContextType {
  user: UserProfile | null;
  username: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await authFetch("/users/me/");
      if (response.ok) {
        const userData: UserProfile = await response.json();
        setUser(userData);
        const name = userData.first_name || userData.username || "Usuário";
        setUsername(name);
        localStorage.setItem("username", name);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil do usuário:", err);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setUsername("");
        setIsLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode<JWTPayload>(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          // Token expirado, tenta renovar
          const refresh = localStorage.getItem("refresh_token");
          if (!refresh) {
            throw new Error("Sem refresh token");
          }
        }
      } catch {
        // Ignora erro de decode e deixa a chamada API verificar
      }

      const cachedName = localStorage.getItem("username");
      if (cachedName) {
        setUsername(cachedName);
      }

      setIsAuthenticated(true);
      await fetchUserProfile();
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setUsername("");
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    setIsAuthenticated(true);
    await fetchUserProfile();
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    setUser(null);
    setUsername("");
    setIsAuthenticated(false);
    router.push("/login");
  };

  const refreshUser = async () => {
    await fetchUserProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        username,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
