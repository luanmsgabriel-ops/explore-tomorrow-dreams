export type TomorrowLiveGlobeRuntime = readonly [
  typeof import("three"),
  typeof import("three-globe"),
];

let runtimePromise: Promise<TomorrowLiveGlobeRuntime> | null = null;

export function preloadTomorrowLiveGlobeRuntime() {
  runtimePromise ??= Promise.all([import("three"), import("three-globe")]);
  return runtimePromise;
}
