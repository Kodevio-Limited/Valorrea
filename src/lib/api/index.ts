/**
 * Data layer barrel. UI components import everything from "@/lib/api" only —
 * never from /lib/mock directly. To integrate the real backend later,
 * re-implement the function bodies here (or in sub-modules) as fetch() calls;
 * no UI file should need to change.
 */

export * from "./users";
export * from "./content";
export * from "./community";
export * from "./prayerRequests";
export * from "./notifications";
