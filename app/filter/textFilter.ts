import * as crypto from "crypto"

// Function to filter text content
export function filterText(text: string): { isFiltered: boolean; reason?: string } {
  if (!text || text.length < 5) {
    return { isFiltered: false }
  }

  // Normalize text for comparison
  const normalizedText = text.toLowerCase().trim()

  // Generate hash for the text
  const textHash = crypto.createHash("sha256").update(normalizedText).digest("hex")

  return {
    isFiltered: false,
    textHash,
  }
}

// Function to check text similarity (for fuzzy matching)
export function getTextSimilarity(text1: string, text2: string): number {
  // Simple implementation of Levenshtein distance
  const a = text1.toLowerCase()
  const b = text2.toLowerCase()
  const matrix = []

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        )
      }
    }
  }

  // Calculate similarity as a percentage
  const maxLength = Math.max(a.length, b.length)
  const distance = matrix[b.length][a.length]
  return 100 - (distance * 100) / maxLength
}
