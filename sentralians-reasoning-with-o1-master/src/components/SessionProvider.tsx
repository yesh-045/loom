"use client"

import React, { createContext, useContext, ReactNode } from "react";

// Stub session context
const StubSessionContext = createContext({
  data: {
    user: {
      id: "stub-user-123",
      name: "Demo User",
      email: "demo@loom.com"
    }
  },
  status: "authenticated" as const
});

export const useSession = () => useContext(StubSessionContext);

export default function StubSessionProvider({ children }: { children: ReactNode }) {
  return (
    <StubSessionContext.Provider value={{
      data: {
        user: {
          id: "stub-user-123",
          name: "Demo User", 
          email: "demo@loom.com"
        }
      },
      status: "authenticated"
    }}>
      {children}
    </StubSessionContext.Provider>
  );
}