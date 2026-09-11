import { lazy, type ComponentType } from "react";

const RELOAD_FLAG = "tomorrow:chunk-reloaded";

/**
 * Wraps React.lazy so that a stale cached app shell (old chunk hashes after a
 * new deploy) triggers a single hard reload instead of a blank screen.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const module = await factory();
      window.sessionStorage?.removeItem(RELOAD_FLAG);
      return module;
    } catch (error) {
      const alreadyReloaded = window.sessionStorage?.getItem(RELOAD_FLAG) === "1";
      if (!alreadyReloaded) {
        window.sessionStorage?.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
