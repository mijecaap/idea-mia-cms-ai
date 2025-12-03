"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================
// Chat State
// ============================================

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  imageUrl?: string;
  timestamp: Date;
  toolCalls?: {
    name: string;
    args: Record<string, unknown>;
    result: string;
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

interface ChatState {
  // Current session
  currentSessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  // Sessions list
  sessions: ChatSession[];
  sessionsLoading: boolean;

  // Actions
  setCurrentSession: (sessionId: string | null) => void;
  setCurrentSessionKeepMessages: (sessionId: string) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setSessionsLoading: (loading: boolean) => void;
  addSession: (session: ChatSession) => void;
  removeSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentSessionId: null,
      messages: [],
      isLoading: false,
      error: null,
      sessions: [],
      sessionsLoading: false,

      setCurrentSession: (sessionId) =>
        set({ currentSessionId: sessionId, messages: [], error: null }),

      setCurrentSessionKeepMessages: (sessionId) =>
        set({ currentSessionId: sessionId }),

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: crypto.randomUUID(),
              timestamp: new Date(),
            },
          ],
        })),

      setMessages: (messages) => set({ messages }),

      clearMessages: () => set({ messages: [], currentSessionId: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setSessions: (sessions) => set({ sessions }),

      setSessionsLoading: (loading) => set({ sessionsLoading: loading }),

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
        })),

      removeSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId:
            state.currentSessionId === sessionId ? null : state.currentSessionId,
        })),
    }),
    {
      name: "cms-ai-chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);

// ============================================
// Pending Actions State (for confirmation flow)
// ============================================

export interface PendingAction {
  id: string;
  tool: string;
  contentType: string;
  args: Record<string, unknown>;
  description: string;
  createdAt: Date;
}

interface ActionsState {
  pendingActions: PendingAction[];
  actionHistory: {
    id: string;
    action: PendingAction;
    status: "approved" | "rejected";
    timestamp: Date;
  }[];

  addPendingAction: (action: Omit<PendingAction, "id" | "createdAt">) => string;
  removePendingAction: (id: string) => void;
  approveAction: (id: string) => PendingAction | undefined;
  rejectAction: (id: string) => void;
  clearPendingActions: () => void;
}

export const useActionsStore = create<ActionsState>()((set, get) => ({
  pendingActions: [],
  actionHistory: [],

  addPendingAction: (action) => {
    const id = crypto.randomUUID();
    set((state) => ({
      pendingActions: [
        ...state.pendingActions,
        { ...action, id, createdAt: new Date() },
      ],
    }));
    return id;
  },

  removePendingAction: (id) =>
    set((state) => ({
      pendingActions: state.pendingActions.filter((a) => a.id !== id),
    })),

  approveAction: (id) => {
    const action = get().pendingActions.find((a) => a.id === id);
    if (action) {
      set((state) => ({
        pendingActions: state.pendingActions.filter((a) => a.id !== id),
        actionHistory: [
          ...state.actionHistory,
          { id, action, status: "approved", timestamp: new Date() },
        ],
      }));
    }
    return action;
  },

  rejectAction: (id) => {
    const action = get().pendingActions.find((a) => a.id === id);
    if (action) {
      set((state) => ({
        pendingActions: state.pendingActions.filter((a) => a.id !== id),
        actionHistory: [
          ...state.actionHistory,
          { id, action, status: "rejected", timestamp: new Date() },
        ],
      }));
    }
  },

  clearPendingActions: () => set({ pendingActions: [] }),
}));

// ============================================
// Notifications State (for webhook events)
// ============================================

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => {
      const newNotification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        read: false,
      };
      return {
        notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
        unreadCount: state.unreadCount + 1,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (notification && !notification.read) {
        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }
      return state;
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    }),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
