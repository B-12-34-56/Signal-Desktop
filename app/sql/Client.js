"use strict";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var import_db = require("./db");
async function saveContentHash(data) {
  return import_db.db.run(
    `
    INSERT OR REPLACE INTO content_hashes (
      hash,
      content_type,
      timestamp,
      content
    ) VALUES (
      $hash,
      $contentType,
      $timestamp,
      $content
    )`,
    {
      $hash: data.hash,
      $contentType: data.contentType,
      $timestamp: data.timestamp,
      $content: data.content || null
    }
  );
}
__name(saveContentHash, "saveContentHash");
async function getContentHashByHash(hash) {
  return import_db.db.get(
    `
    SELECT * FROM content_hashes
    WHERE hash = $hash
  `,
    {
      $hash: hash
    }
  );
}
__name(getContentHashByHash, "getContentHashByHash");
async function getContentHashes(contentType) {
  if (contentType) {
    return import_db.db.all(
      `
      SELECT * FROM content_hashes
      WHERE content_type = $contentType
      ORDER BY timestamp DESC
    `,
      {
        $contentType: contentType
      }
    );
  } else {
    return import_db.db.all(`
      SELECT * FROM content_hashes
      ORDER BY timestamp DESC
    `);
  }
}
__name(getContentHashes, "getContentHashes");
async function saveFilterSettings(settings) {
  return import_db.db.run(
    `
    INSERT OR REPLACE INTO filter_settings (
      id,
      is_enabled,
      is_global_enabled,
      similarity_threshold
    ) VALUES (
      1,
      $isEnabled,
      $isGlobalEnabled,
      $similarityThreshold
    )`,
    {
      $isEnabled: settings.isEnabled ? 1 : 0,
      $isGlobalEnabled: settings.isGlobalEnabled ? 1 : 0,
      $similarityThreshold: settings.similarityThreshold || 90
    }
  );
}
__name(saveFilterSettings, "saveFilterSettings");
async function getFilterSettings() {
  const row = await import_db.db.get("SELECT * FROM filter_settings WHERE id = 1");
  if (!row) {
    return void 0;
  }
  return {
    isEnabled: Boolean(row.is_enabled),
    isGlobalEnabled: Boolean(row.is_global_enabled),
    similarityThreshold: row.similarity_threshold
  };
}
__name(getFilterSettings, "getFilterSettings");
async function saveFilterStats(stats) {
  return import_db.db.run(
    `
    INSERT OR REPLACE INTO filter_stats (
      id,
      images_blocked,
      texts_blocked,
      videos_blocked,
      last_updated
    ) VALUES (
      1,
      $imagesBlocked,
      $textsBlocked,
      $videosBlocked,
      $lastUpdated
    )`,
    {
      $imagesBlocked: stats.imagesBlocked,
      $textsBlocked: stats.textsBlocked,
      $videosBlocked: stats.videosBlocked,
      $lastUpdated: Date.now()
    }
  );
}
__name(saveFilterStats, "saveFilterStats");
async function getFilterStats() {
  const row = await import_db.db.get("SELECT * FROM filter_stats WHERE id = 1");
  if (!row) {
    return void 0;
  }
  return {
    imagesBlocked: row.images_blocked,
    textsBlocked: row.texts_blocked,
    videosBlocked: row.videos_blocked
  };
}
__name(getFilterStats, "getFilterStats");
