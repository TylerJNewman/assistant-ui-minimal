"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";

interface CurrentThreadContextType {
  currentThreadId: string | null;
  setCurrentThreadId: (id: string | null) => void;
}

const CurrentThreadContext = createContext<CurrentThreadContextType | undefined>(
  undefined,
);

export const CurrentThreadProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ currentThreadId, setCurrentThreadId }),
    [currentThreadId],
  );

  return (
    <CurrentThreadContext.Provider value={value}>
      {children}
    </CurrentThreadContext.Provider>
  );
};

export const useCurrentThread = () => {
  const context = useContext(CurrentThreadContext);
  if (!context) {
    throw new Error(
      "useCurrentThread must be used within a CurrentThreadProvider",
    );
  }
  return context;
}; 