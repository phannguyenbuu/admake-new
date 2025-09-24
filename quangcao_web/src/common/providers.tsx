import React, { createContext, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ConfigProvider, theme as antdTheme, App } from "antd";

// Configure QueryClient with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const CommonContext = createContext({
  theme: localStorage.getItem("theme") || "light",
  setTheme: () => {},
});

export const useCommonContext = () => React.useContext(CommonContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") || "light") as "light" | "dark"
  );

  useEffect(() => {
    // Global error handler for unhandled errors
    const handleGlobalError = (event: ErrorEvent) => {
      // Prevent the error from breaking the app
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent the error from breaking the app
      event.preventDefault();
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <App>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm:
              theme === "dark"
                ? antdTheme.darkAlgorithm
                : antdTheme.defaultAlgorithm,
          }}
        >
          <CommonContext.Provider
            value={{
              theme,
              setTheme: toggleTheme,
            }}
          >
            {children}
          </CommonContext.Provider>
        </ConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </App>
  );
}
