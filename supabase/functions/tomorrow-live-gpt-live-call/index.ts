declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

import { createGptLiveCallHandler } from "./core.ts";

export const handler = createGptLiveCallHandler({ env: Deno.env });

Deno.serve(handler);
