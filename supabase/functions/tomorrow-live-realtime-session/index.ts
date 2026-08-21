declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

import { createRealtimeSessionHandler } from "./core.ts";

export const handler = createRealtimeSessionHandler({ env: Deno.env });

Deno.serve(handler);
