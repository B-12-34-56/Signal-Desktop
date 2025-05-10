import React, { useState, useRef, useCallback, useEffect } from "react"
import { ImageTag } from "./imageTagService"
import { FilterService } from "./FilterService"
import { createRoot } from "react-dom/client"

interface FilterImageUploadProps {
  onUploadComplete?: (success: boolean) => void
  allowMultiple?: boolean
  height?: number | string
  width?: number | string
  className?: string
}

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  tags: ImageTag[]
  uploadedImageUrl: string | null
}

export const FilterImageUpload: React.FC<FilterImageUploadProps> = ({
  onUploadComplete,
  allowMultiple = false,
  height = 300,
  width = "100%",
  className = "",
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    tags: [],
    uploadedImageUrl: null,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)
  const filterService = useRef<FilterService>(new FilterService())
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uploadState.isUploading) {
      setIsDragging(true)
    }
  }, [uploadState.isUploading])

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      tags: [],
      uploadedImageUrl: null,
    })
    setShowConfirmation(false)
  }, [])

  const processFiles = useCallback(async (files: FileList) => {
    if (!files.length) return
    
    // Only process the first file if multiple aren't allowed
    const file = files[0]
    
    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      setUploadState(prev => ({ ...prev, error: "Please select an image file." }))
      return
    }
    
    // Start upload process
    setUploadState({
      isUploading: true,
      progress: 10,
      error: null,
      tags: [],
      uploadedImageUrl: null,
    })
    
    try {
      // Read file as buffer
      const buffer = await readFileAsBuffer(file)
      
      // Simulate upload progress
      setUploadState(prev => ({ ...prev, progress: 30 }))
      
      // Process the image with FilterService
      const tags = await filterService.current.handleImageTags(buffer)
      
      // Update progress
      setUploadState(prev => ({ ...prev, progress: 70 }))
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file)
      
      // Complete the upload process
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        tags,
        uploadedImageUrl: objectUrl,
      })
      
      // Show confirmation dialog if we have tags
      if (tags.length > 0) {
        setShowConfirmation(true)
      } else {
        // Auto-confirm if no tags (unusual case)
        handleConfirmUpload()
      }
    } catch (error) {
      console.error("Error processing image:", error)
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }))
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (!uploadState.isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [uploadState.isUploading, processFiles])

  const handleFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const handleConfirmUpload = useCallback(async () => {
    try {
      // Final submission logic with FilterService
      if (uploadState.uploadedImageUrl) {
        const blob = await fetch(uploadState.uploadedImageUrl).then(r => r.blob())
        const buffer = await blob.arrayBuffer().then(ab => Buffer.from(ab))
        
        // Process the attachment with FilterService
        const attachment = {
          data: buffer,
          fileName: "uploaded-image.jpg", // Default name
          contentType: blob.type,
        }
        
        const success = await filterService.current.handleImageAttachment(attachment)
        
        if (onUploadComplete) {
          onUploadComplete(success)
        }
        
        resetUploadState()
      }
    } catch (error) {
      console.error("Error confirming upload:", error)
      setUploadState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Error confirming upload",
      }))
    }
  }, [uploadState.uploadedImageUrl, resetUploadState, onUploadComplete])

  const handleCancelUpload = useCallback(() => {
    // Clean up object URL
    if (uploadState.uploadedImageUrl) {
      URL.revokeObjectURL(uploadState.uploadedImageUrl)
    }
    
    resetUploadState()
  }, [uploadState.uploadedImageUrl, resetUploadState])

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (uploadState.uploadedImageUrl) {
        URL.revokeObjectURL(uploadState.uploadedImageUrl)
      }
    }
  }, [uploadState.uploadedImageUrl])

  const readFileAsBuffer = (file: File): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer
        const buffer = Buffer.from(arrayBuffer)
        resolve(buffer)
      }
      
      reader.onerror = () => {
        reject(new Error("Error reading file"))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  const renderTagCategories = (tags: ImageTag[]) => {
    // Group tags by category
    const categories: Record<string, ImageTag[]> = {}
    
    tags.forEach(tag => {
      const category = tag.categories?.[0] || "Other"
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(tag)
    })
    
    return (
      <div className="filter-image-upload__tags-categories">
        {Object.entries(categories).map(([category, categoryTags]) => (
          <div key={category} className="filter-image-upload__tag-category">
            <h4 className="filter-image-upload__tag-category-title">{category}</h4>
            <div className="filter-image-upload__tag-list">
              {categoryTags.map(tag => (
                <span
                  key={tag.name}
                  className={`filter-image-upload__tag ${
                    tag.isModerationFlag ? "filter-image-upload__tag--warning" : ""
                  }`}
                  title={`Confidence: ${tag.confidence.toFixed(1)}%`}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const getModerationTags = (tags: ImageTag[]) => {
    return tags.filter(tag => tag.isModerationFlag)
  }

  return (
    <div className={`filter-image-upload ${className}`} style={{ width }}>
      {!showConfirmation ? (
        <div
          ref={dropzoneRef}
          className={`filter-image-upload__dropzone ${isDragging ? "filter-image-upload__dropzone--active" : ""} ${uploadState.isUploading ? "filter-image-upload__dropzone--uploading" : ""}`}
          style={{ height }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!uploadState.isUploading ? handleFileSelect : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={allowMultiple}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          
          {uploadState.isUploading ? (
            <div className="filter-image-upload__progress">
              <div className="filter-image-upload__progress-bar">
                <div
                  className="filter-image-upload__progress-fill"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <div className="filter-image-upload__progress-text">
                Uploading... {uploadState.progress}%
              </div>
            </div>
          ) : uploadState.error ? (
            <div className="filter-image-upload__error">
              <div className="filter-image-upload__error-icon">
                <span>❌</span>
              </div>
              <div className="filter-image-upload__error-message">{uploadState.error}</div>
              <button
                className="filter-image-upload__retry-button"
                onClick={(e) => {
                  e.stopPropagation()
                  resetUploadState()
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="filter-image-upload__placeholder">
              <div className="filter-image-upload__icon">
                <span>📷</span>
              </div>
              <div className="filter-image-upload__text">
                <div className="filter-image-upload__title">Upload Image</div>
                <div className="filter-image-upload__subtitle">
                  Drag and drop an image here, or click to select from your device
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="filter-image-upload__confirmation" style={{ height }}>
          <div className="filter-image-upload__preview">
            {uploadState.uploadedImageUrl && (
              <img
                src={uploadState.uploadedImageUrl}
                alt="Upload preview"
                className="filter-image-upload__preview-image"
              />
            )}
          </div>
          
          <div className="filter-image-upload__tags">
            <h3 className="filter-image-upload__tags-title">Image Content</h3>
            
            {uploadState.tags.length > 0 ? (
              <>
                {renderTagCategories(uploadState.tags)}
                
                {getModerationTags(uploadState.tags).length > 0 && (
                  <div className="filter-image-upload__moderation-warning">
                    <span>⚠️</span> This image contains potentially sensitive content.
                  </div>
                )}
              </>
            ) : (
              <div className="filter-image-upload__no-tags">
                No content detected in this image.
              </div>
            )}
          </div>
          
          <div className="filter-image-upload__actions">
            <button
              className="filter-image-upload__button filter-image-upload__button--secondary"
              onClick={handleCancelUpload}
            >
              Cancel
            </button>
            <button
              className="filter-image-upload__button filter-image-upload__button--primary"
              onClick={handleConfirmUpload}
            >
              Confirm Upload
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .filter-image-upload {
          font-family: var(--font-family, sans-serif);
          color: var(--color-text, #333);
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }

        .filter-image-upload__dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--color-border, #ccc);
          border-radius: 8px;
          background-color: var(--color-background-secondary, #f9f9f9);
          transition: all 0.2s ease;
          cursor: pointer;
          padding: 20px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .filter-image-upload__dropzone--active {
          border-color: var(--color-accent, #2090ea);
          background-color: var(--color-background-highlight, #e9f4fd);
        }

        .filter-image-upload__dropzone--uploading {
          cursor: default;
          opacity: 0.8;
        }

        .filter-image-upload__icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .filter-image-upload__title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .filter-image-upload__subtitle {
          font-size: 14px;
          color: var(--color-text-secondary, #666);
          text-align: center;
        }

        .filter-image-upload__progress {
          width: 80%;
          max-width: 300px;
        }

        .filter-image-upload__progress-bar {
          height: 8px;
          background-color: var(--color-background-tertiary, #e1e1e1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .filter-image-upload__progress-fill {
          height: 100%;
          background-color: var(--color-accent, #2090ea);
          transition: width 0.3s ease;
        }

        .filter-image-upload__progress-text {
          text-align: center;
          font-size: 14px;
          color: var(--color-text-secondary, #666);
        }

        .filter-image-upload__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .filter-image-upload__error-icon {
          font-size: 32px;
        }

        .filter-image-upload__error-message {
          color: var(--color-error, #cc0000);
          text-align: center;
          max-width: 80%;
        }

        .filter-image-upload__retry-button {
          background-color: var(--color-accent, #2090ea);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          margin-top: 8px;
        }

        .filter-image-upload__confirmation {
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: 16px;
          overflow: auto;
        }

        .filter-image-upload__preview {
          text-align: center;
          padding: 8px;
          background-color: var(--color-background-tertiary, #e1e1e1);
          border-radius: 4px;
          max-height: 200px;
          overflow: hidden;
        }

        .filter-image-upload__preview-image {
          max-width: 100%;
          max-height: 180px;
          object-fit: contain;
        }

        .filter-image-upload__tags {
          overflow: auto;
          padding: 0 16px;
        }

        .filter-image-upload__tags-title {
          margin: 8px 0 16px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
        }

        .filter-image-upload__tags-categories {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-image-upload__tag-category-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px;
          color: var(--color-text-secondary, #666);
        }

        .filter-image-upload__tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filter-image-upload__tag {
          background-color: var(--color-background-secondary, #f0f0f0);
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          white-space: nowrap;
        }

        .filter-image-upload__tag--warning {
          background-color: var(--color-warning-background, #fff3cd);
          color: var(--color-warning-text, #856404);
        }

        .filter-image-upload__moderation-warning {
          margin-top: 16px;
          padding: 8px;
          background-color: var(--color-warning-background, #fff3cd);
          color: var(--color-warning-text, #856404);
          border-radius: 4px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-image-upload__no-tags {
          text-align: center;
          color: var(--color-text-secondary, #666);
          padding: 16px;
        }

        .filter-image-upload__actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px;
          border-top: 1px solid var(--color-border, #ccc);
        }

        .filter-image-upload__button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .filter-image-upload__button--primary {
          background-color: var(--color-accent, #2090ea);
          color: white;
          border: none;
        }

        .filter-image-upload__button--primary:hover {
          background-color: var(--color-accent-hover, #1a7fd1);
        }

        .filter-image-upload__button--secondary {
          background-color: transparent;
          color: var(--color-text, #333);
          border: 1px solid var(--color-border, #ccc);
        }

        .filter-image-upload__button--secondary:hover {
          background-color: var(--color-background-tertiary, #e1e1e1);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .filter-image-upload__confirmation {
            grid-template-rows: auto auto 1fr auto;
          }
          
          .filter-image-upload__preview {
            max-height: 150px;
          }
          
          .filter-image-upload__preview-image {
            max-height: 130px;
          }
        }

        @media (max-width: 480px) {
          .filter-image-upload__title {
            font-size: 16px;
          }
          
          .filter-image-upload__subtitle {
            font-size: 12px;
          }
          
          .filter-image-upload__icon {
            font-size: 32px;
          }
          
          .filter-image-upload__actions {
            flex-direction: column;
            gap: 8px;
          }
          
          .filter-image-upload__button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export const renderFilterImageUpload = (
  element: HTMLElement,
  props: FilterImageUploadProps = {}
) => {
  const root = createRoot(element)
  root.render(<FilterImageUpload {...props} />)
  return () => root.unmount()
}

export default FilterImageUpload