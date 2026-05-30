// IndexedDB for the Consul Brain.
//
// NOTE: We open IndexedDB *directly in the service worker*. MV3 service workers
// have IndexedDB, and it persists on disk across worker restarts — the offscreen
// document the spec mentions is only needed for things a SW genuinely cannot do
// (DOM, audio, clipboard). So no offscreen doc is used for storage.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Activity, Stamp, VisitRecord } from "../types.ts";

interface WebPassportDB extends DBSchema {
  activities: {
    key: string;
    value: Activity;
    indexes: { "by-status": string };
  };
  stamps: {
    key: string;
    value: Stamp;
    indexes: { "by-domain": string; "by-activity": string };
  };
  visits: {
    key: string;
    value: VisitRecord;
    indexes: { "by-domain": string };
  };
}

const DB_NAME = "web-passport";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WebPassportDB>> | null = null;

export function db(): Promise<IDBPDatabase<WebPassportDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WebPassportDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const activities = database.createObjectStore("activities", { keyPath: "id" });
        activities.createIndex("by-status", "status");

        const stamps = database.createObjectStore("stamps", { keyPath: "id" });
        stamps.createIndex("by-domain", "domain");
        stamps.createIndex("by-activity", "activityId");

        const visits = database.createObjectStore("visits", { keyPath: "id" });
        visits.createIndex("by-domain", "domain");
      },
    });
  }
  return dbPromise;
}
