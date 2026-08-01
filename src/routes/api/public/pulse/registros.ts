import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pulse/registros")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { servePulseResource } = await import("@/lib/pulse-serve.server");
        return servePulseResource("registros", request);
      },
    },
  },
});
