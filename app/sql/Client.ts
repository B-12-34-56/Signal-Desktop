import { db } from "./db"

// Add these methods to the existing SQL Client.

async function saveContentHash(data) {
  return db.run(
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
      $content: data.content || null,
    },
  )
}

async function getContentHashByHash(hash) {
  return db.get(
    `
    SELECT * FROM content_hashes
    WHERE hash = $hash
  `,
    {
      $hash: hash,
    },
  )
}

async function getContentHashes(contentType) {
  if (contentType) {
    return db.all(
      `
      SELECT * FROM content_hashes
      WHERE content_type = $contentType
      ORDER BY timestamp DESC
    `,
      {
        $contentType: contentType,
      },
    )
  } else {
    return db.all(`
      SELECT * FROM content_hashes
      ORDER BY timestamp DESC
    `)
  }
}

async function saveFilterSettings(settings) {
  return db.run(
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
      $similarityThreshold: settings.similarityThreshold || 90,
    },
  )
}

async function getFilterSettings() {
  const row = await db.get("SELECT * FROM filter_settings WHERE id = 1")
  if (!row) {
    return undefined
  }

  return {
    isEnabled: Boolean(row.is_enabled),
    isGlobalEnabled: Boolean(row.is_global_enabled),
    similarityThreshold: row.similarity_threshold,
  }
}

async function saveFilterStats(stats) {
  return db.run(
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
      $lastUpdated: Date.now(),
    },
  )
}

async function getFilterStats() {
  const row = await db.get("SELECT * FROM filter_stats WHERE id = 1")
  if (!row) {
    return undefined
  }

  return {
    imagesBlocked: row.images_blocked,
    textsBlocked: row.texts_blocked,
    videosBlocked: row.videos_blocked,
  }
}
