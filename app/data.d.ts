// Add these type definitions to the existing data.d.ts file

declare namespace Signal.Data {
  // Content hash functions
  function saveContentHash(data: {
    hash: string
    contentType: "image" | "text" | "video"
    timestamp: number
    content?: string
  }): Promise<void>

  function getContentHashByHash(hash: string): Promise<any>

  function getContentHashes(contentType?: "image" | "text" | "video"): Promise<
    Array<{
      id: number
      hash: string
      contentType: string
      timestamp: number
      content?: string
    }>
  >

  // Filter settings functions
  function saveFilterSettings(settings: {
    isEnabled: boolean
    isGlobalEnabled: boolean
    similarityThreshold?: number
  }): Promise<void>

  function getFilterSettings(): Promise<
    | {
        isEnabled: boolean
        isGlobalEnabled: boolean
        similarityThreshold: number
      }
    | undefined
  >

  // Filter stats functions
  function saveFilterStats(stats: {
    imagesBlocked: number
    textsBlocked: number
    videosBlocked: number
  }): Promise<void>

  function getFilterStats(): Promise<
    | {
        imagesBlocked: number
        textsBlocked: number
        videosBlocked: number
      }
    | undefined
  >

  // Update conversation to include filter exclusion
  function updateConversation(id: string, data: { filterExcluded?: boolean }): Promise<void>
}
