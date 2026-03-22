import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: number;
  username: string;
}

export interface Kudo {
  id: number;
  message: string;
  authorId: number;
  receiverId: number;
  createdAt: string;
  author: { id: number; username: string };
  receiver: { id: number; username: string };
}

// ---------------------------------------------------------------------------
// Auth store
// ---------------------------------------------------------------------------

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initialise from localStorage so the session survives a page refresh
  token: localStorage.getItem("accessToken"),
  user: null,

  setAuth: (token, user) => {
    localStorage.setItem("accessToken", token);
    set({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem("accessToken");
    set({ token: null, user: null });
  },
}));

// ---------------------------------------------------------------------------
// Kudos feed store
// ---------------------------------------------------------------------------

interface KudosState {
  kudos: Kudo[];
  setKudos: (kudos: Kudo[]) => void;
  prependKudo: (kudo: Kudo) => void;
}

export const useKudosStore = create<KudosState>((set) => ({
  kudos: [],
  setKudos: (kudos) => set({ kudos }),
  prependKudo: (kudo) => set((state) => ({ kudos: [kudo, ...state.kudos] })),
}));
