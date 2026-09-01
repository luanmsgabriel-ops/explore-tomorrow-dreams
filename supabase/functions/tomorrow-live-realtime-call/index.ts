declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

import { createRealtimeCallHandler } from "./core.ts";

export const handler = createRealtimeCallHandler({ env: Deno.env });

Deno.serve(handler);
