import * as crypto from "crypto"
import { Image } from "image-js"

// Function to generate a perceptual hash for an image
// This is more robust than a simple hash as it can detect similar images
export async function getImageHash(imageData: Buffer): Promise<string> {
  try {
    // Load the image
    const image = await Image.load(imageData)

    // Resize to 8x8 for perceptual hashing
    const resized = image.resize({ width: 8, height: 8 })

    // Convert to grayscale
    const gray = resized.grey()

    // Calculate average pixel value
    let sum = 0
    for (let i = 0; i < gray.data.length; i++) {
      sum += gray.data[i]
    }
    const avg = sum / gray.data.length

    // Generate binary hash based on whether pixel is above or below average
    let binaryHash = ""
    for (let i = 0; i < gray.data.length; i++) {
      binaryHash += gray.data[i] >= avg ? "1" : "0"
    }

    // Convert binary hash to hex
    const hexHash = Number.parseInt(binaryHash, 2).toString(16).padStart(16, "0")

    return hexHash
  } catch (error) {
    console.error("Error generating image hash:", error)

    // Fallback to simple hash if perceptual hashing fails
    return crypto.createHash("sha256").update(imageData).digest("hex")
  }
}

// Function to compare two image hashes and determine similarity
export function compareImageHashes(hash1: string, hash2: string): number {
  // Convert hex hashes back to binary
  const binary1 = Number.parseInt(hash1, 16).toString(2).padStart(64, "0")
  const binary2 = Number.parseInt(hash2, 16).toString(2).padStart(64, "0")

  // Count differences (Hamming distance)
  let distance = 0
  for (let i = 0; i < binary1.length; i++) {
    if (binary1[i] !== binary2[i]) {
      distance++
    }
  }

  // Return similarity percentage (0-100)
  return 100 - (distance * 100) / 64
}
