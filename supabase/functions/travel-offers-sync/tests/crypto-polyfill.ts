import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: crypto
  });
}
