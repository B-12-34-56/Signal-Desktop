// Add this new file to handle filter operations in the main process

const { ipcMain } = require("electron")
const path = require("path")
const fs = require("fs")
const { FilterService } = require("../filter")

// Initialize filter service
const filterService = new FilterService()

// Register IPC handlers
ipcMain.handle("filter:save-settings", async (event, settings) => {
  try {
    await window.Signal.Data.saveFilterSettings(settings)
    return { success: true }
  } catch (error) {
    console.error("Error saving filter settings:", error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle("filter:get-settings", async () => {
  try {
    return await window.Signal.Data.getFilterSettings()
  } catch (error) {
    console.error("Error getting filter settings:", error)
    return null
  }
})

ipcMain.handle("filter:get-stats", async () => {
  try {
    return await window.Signal.Data.getFilterStats()
  } catch (error) {
    console.error("Error getting filter stats:", error)
    return null
  }
})

ipcMain.handle("filter:reset-stats", async () => {
  try {
    await window.Signal.Data.saveFilterStats({
      imagesBlocked: 0,
      textsBlocked: 0,
      videosBlocked: 0,
    })
    return { success: true }
  } catch (error) {
    console.error("Error resetting filter stats:", error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle("filter:test-image", async (event, imagePath) => {
  try {
    const imageData = fs.readFileSync(imagePath)
    const result = await filterService.handleImageAttachment({ data: imageData })
    return { allowed: result }
  } catch (error) {
    console.error("Error testing image:", error)
    return { error: error.message }
  }
})

ipcMain.handle("filter:test-text", async (event, text) => {
  try {
    const result = await filterService.handleTextMessage(text)
    return { allowed: result }
  } catch (error) {
    console.error("Error testing text:", error)
    return { error: error.message }
  }
})

ipcMain.handle("filter:configure-aws", async (event, config) => {
  try {
    const { region, accessKeyId, secretAccessKey } = config

    // Update AWS configuration
    process.env.AWS_REGION = region
    process.env.AWS_ACCESS_KEY_ID = accessKeyId
    process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey

    // Reinitialize DynamoDB client
    const { initializeDynamoDB, ensureTableExists } = require("../aws/dynamodb")
    initializeDynamoDB(region)
    await ensureTableExists()

    return { success: true }
  } catch (error) {
    console.error("Error configuring AWS:", error)
    return { success: false, error: error.message }
  }
})

module.exports = filterService
