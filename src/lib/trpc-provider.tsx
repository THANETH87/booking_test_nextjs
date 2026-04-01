"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./trpc";
import superjson from "superjson";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
          },
          dehydrate: {
            shouldDehydrateQuery: (query) =>
              defaultShouldDehydrateQuery(query) ||
              query.state.status === "pending",
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
