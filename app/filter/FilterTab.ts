// app/filter/FilterTab.ts

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import * as crypto from "crypto";
import { getImageHash } from "./imageHash";
import { Buffer } from "buffer";

// AWS Configuration
const REGION = "us-east-1";
const TABLE_NAME = "SignalContentHashes";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Types for settings and statistics
export interface FilterSettings {
  isEnabled: boolean;
  isGlobalEnabled: boolean;
}

export interface FilterStats {
  imagesBlocked: number;
  textsBlocked: number;
  videosBlocked: number;
}

// In‐module state
let settings: FilterSettings = { isEnabled: true, isGlobalEnabled: true };
let stats: FilterStats = { imagesBlocked: 0, textsBlocked: 0, videosBlocked: 0 };

// Load persisted settings
export async function loadFilterSettings(): Promise<FilterSettings> {
  try {
    const saved = await window.Signal.Data.getFilterSettings();
    if (saved) {
      settings = {
        isEnabled: saved.isEnabled,
        isGlobalEnabled: saved.isGlobalEnabled,
      };
    }
  } catch (err) {
    console.error("Failed to load filter settings:", err);
  }
  return settings;
}

// Load persisted stats
export async function loadFilterStats(): Promise<FilterStats> {
  try {
    const saved = await window.Signal.Data.getFilterStats();
    if (saved) {
      stats = saved;
    }
  } catch (err) {
    console.error("Failed to load filter stats:", err);
  }
  return stats;
}

// Persist settings whenever they change
export async function saveFilterSettings(newSettings: FilterSettings): Promise<void> {
  settings = newSettings;
  try {
    await window.Signal.Data.saveFilterSettings(settings);
  } catch (err) {
    console.error("Failed to save filter settings:", err);
  }
}

// Persist stats whenever they change
export async function saveFilterStats(newStats: FilterStats): Promise<void> {
  stats = newStats;
  try {
    await window.Signal.Data.saveFilterStats(stats);
  } catch (err) {
    console.error("Failed to save filter stats:", err);
  }
}

// Check for a duplicate in local storage
export async function isLocalDuplicate(
  contentHash: string,
  _contentType: "image" | "text" | "video"
): Promise<boolean> {
  try {
    const result = await window.Signal.Data.getContentHashByHash(contentHash);
    return !!result;
  } catch (err) {
    console.error("Error checking local duplicate:", err);
    return false;
  }
}

// Check for a duplicate globally (DynamoDB)
export async function isGlobalDuplicate(
  contentHash: string,
  _contentType: "image" | "text" | "video"
): Promise<boolean> {
  if (!settings.isGlobalEnabled) return false;
  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "contentHash = :hash",
      ExpressionAttributeValues: { ":hash": contentHash },
    };
    const { Items } = await docClient.send(new QueryCommand(params));
    return Array.isArray(Items) && Items.length > 0;
  } catch (err) {
    console.error("Error checking global duplicate:", err);
    return false;
  }
}

// Save a hash to the global DynamoDB store
export async function saveToGlobalStore(
  contentHash: string,
  _contentType: "image" | "text" | "video"
): Promise<void> {
  if (!settings.isGlobalEnabled) return;
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        contentHash,
        timestamp: new Date().toISOString(),
        deviceId: window.textsecure.storage.user.getDeviceId(),
        userId: window.textsecure.storage.user.getNumber(),
      },
    };
    await docClient.send(new PutCommand(params));
  } catch (err) {
    console.error("Error saving to global store:", err);
  }
}

// Handler for images: returns false to block, true to allow
export async function handleImageAttachment(
  attachment: { data: ArrayBuffer }
   ): Promise<boolean>  {
  if (!settings.isEnabled) return true;
  try {
    // convert ArrayBuffer → Buffer so it matches the getImageHash signature
    const buf = Buffer.from(attachment.data);
    const imageHash = await getImageHash(buf);
    const localDup = await isLocalDuplicate(imageHash, "image");
    const globalDup = await isGlobalDuplicate(imageHash, "image");
    if (localDup || globalDup) {
      const updated = { ...stats, imagesBlocked: stats.imagesBlocked + 1 };
      await saveFilterStats(updated);
      return false;
    }
    // Not a duplicate: record and allow
    await window.Signal.Data.saveContentHash({
      hash: imageHash,
      contentType: "image",
      timestamp: Date.now(),
    });
    await saveToGlobalStore(imageHash, "image");
    return true;
  } catch (err) {
    console.error("Error in image filter:", err);
    return true; // on error, default to allow
  }
}

// Handler for text: returns false to block, true to allow
export async function handleTextMessage(text: string): Promise<boolean> {
  if (!settings.isEnabled || text.length < 5) return true;
  try {
    const textHash = crypto.createHash("sha256").update(text).digest("hex");
    const localDup = await isLocalDuplicate(textHash, "text");
    const globalDup = await isGlobalDuplicate(textHash, "text");
    if (localDup || globalDup) {
      const updated = { ...stats, textsBlocked: stats.textsBlocked + 1 };
      await saveFilterStats(updated);
      return false;
    }
    // Not a duplicate: record and allow
    await window.Signal.Data.saveContentHash({
      hash: textHash,
      contentType: "text",
      timestamp: Date.now(),
    });
    await saveToGlobalStore(textHash, "text");
    return true;
  } catch (err) {
    console.error("Error in text filter:", err);
    return true; // on error, default to allow
  }
}

// Register both handlers on the Signal.Services filterService
export function registerFilterService(): void {
  if (window.Signal?.Services) {
    (window.Signal.Services as any).filterService = {
      handleImageAttachment,
      handleTextMessage,
    };
  }
}

// Convenience initializer: load settings/stats, then register
export async function initializeFilter(): Promise<void> {
  await loadFilterSettings();
  await loadFilterStats();
  registerFilterService();
}
