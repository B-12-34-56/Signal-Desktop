"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var FilterTab_exports = {};
__export(FilterTab_exports, {
  handleImageAttachment: () => handleImageAttachment,
  handleTextMessage: () => handleTextMessage,
  initializeFilter: () => initializeFilter,
  isGlobalDuplicate: () => isGlobalDuplicate,
  isLocalDuplicate: () => isLocalDuplicate,
  loadFilterSettings: () => loadFilterSettings,
  loadFilterStats: () => loadFilterStats,
  registerFilterService: () => registerFilterService,
  saveFilterSettings: () => saveFilterSettings,
  saveFilterStats: () => saveFilterStats,
  saveToGlobalStore: () => saveToGlobalStore
});
module.exports = __toCommonJS(FilterTab_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var crypto = __toESM(require("crypto"));
var import_imageHash = require("./imageHash");
var import_buffer = require("buffer");
const REGION = "us-east-1";
const TABLE_NAME = "SignalContentHashes";
const client = new import_client_dynamodb.DynamoDBClient({ region: REGION });
const docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
let settings = { isEnabled: true, isGlobalEnabled: true };
let stats = { imagesBlocked: 0, textsBlocked: 0, videosBlocked: 0 };
async function loadFilterSettings() {
  try {
    const saved = await window.Signal.Data.getFilterSettings();
    if (saved) {
      settings = {
        isEnabled: saved.isEnabled,
        isGlobalEnabled: saved.isGlobalEnabled
      };
    }
  } catch (err) {
    console.error("Failed to load filter settings:", err);
  }
  return settings;
}
__name(loadFilterSettings, "loadFilterSettings");
async function loadFilterStats() {
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
__name(loadFilterStats, "loadFilterStats");
async function saveFilterSettings(newSettings) {
  settings = newSettings;
  try {
    await window.Signal.Data.saveFilterSettings(settings);
  } catch (err) {
    console.error("Failed to save filter settings:", err);
  }
}
__name(saveFilterSettings, "saveFilterSettings");
async function saveFilterStats(newStats) {
  stats = newStats;
  try {
    await window.Signal.Data.saveFilterStats(stats);
  } catch (err) {
    console.error("Failed to save filter stats:", err);
  }
}
__name(saveFilterStats, "saveFilterStats");
async function isLocalDuplicate(contentHash, _contentType) {
  try {
    const result = await window.Signal.Data.getContentHashByHash(contentHash);
    return !!result;
  } catch (err) {
    console.error("Error checking local duplicate:", err);
    return false;
  }
}
__name(isLocalDuplicate, "isLocalDuplicate");
async function isGlobalDuplicate(contentHash, _contentType) {
  if (!settings.isGlobalEnabled) return false;
  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "contentHash = :hash",
      ExpressionAttributeValues: { ":hash": contentHash }
    };
    const { Items } = await docClient.send(new import_lib_dynamodb.QueryCommand(params));
    return Array.isArray(Items) && Items.length > 0;
  } catch (err) {
    console.error("Error checking global duplicate:", err);
    return false;
  }
}
__name(isGlobalDuplicate, "isGlobalDuplicate");
async function saveToGlobalStore(contentHash, _contentType) {
  if (!settings.isGlobalEnabled) return;
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        contentHash,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        deviceId: window.textsecure.storage.user.getDeviceId(),
        userId: window.textsecure.storage.user.getNumber()
      }
    };
    await docClient.send(new import_lib_dynamodb.PutCommand(params));
  } catch (err) {
    console.error("Error saving to global store:", err);
  }
}
__name(saveToGlobalStore, "saveToGlobalStore");
async function handleImageAttachment(attachment) {
  if (!settings.isEnabled) return true;
  try {
    const buf = import_buffer.Buffer.from(attachment.data);
    const imageHash = await (0, import_imageHash.getImageHash)(buf);
    const localDup = await isLocalDuplicate(imageHash, "image");
    const globalDup = await isGlobalDuplicate(imageHash, "image");
    if (localDup || globalDup) {
      const updated = { ...stats, imagesBlocked: stats.imagesBlocked + 1 };
      await saveFilterStats(updated);
      return false;
    }
    await window.Signal.Data.saveContentHash({
      hash: imageHash,
      contentType: "image",
      timestamp: Date.now()
    });
    await saveToGlobalStore(imageHash, "image");
    return true;
  } catch (err) {
    console.error("Error in image filter:", err);
    return true;
  }
}
__name(handleImageAttachment, "handleImageAttachment");
async function handleTextMessage(text) {
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
    await window.Signal.Data.saveContentHash({
      hash: textHash,
      contentType: "text",
      timestamp: Date.now()
    });
    await saveToGlobalStore(textHash, "text");
    return true;
  } catch (err) {
    console.error("Error in text filter:", err);
    return true;
  }
}
__name(handleTextMessage, "handleTextMessage");
function registerFilterService() {
  if (window.Signal?.Services) {
    window.Signal.Services.filterService = {
      handleImageAttachment,
      handleTextMessage
    };
  }
}
__name(registerFilterService, "registerFilterService");
async function initializeFilter() {
  await loadFilterSettings();
  await loadFilterStats();
  registerFilterService();
}
__name(initializeFilter, "initializeFilter");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handleImageAttachment,
  handleTextMessage,
  initializeFilter,
  isGlobalDuplicate,
  isLocalDuplicate,
  loadFilterSettings,
  loadFilterStats,
  registerFilterService,
  saveFilterSettings,
  saveFilterStats,
  saveToGlobalStore
});
