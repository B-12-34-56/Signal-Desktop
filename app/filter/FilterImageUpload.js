"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var FilterImageUpload_exports = {};
__export(FilterImageUpload_exports, {
  FilterImageUpload: () => FilterImageUpload,
  default: () => FilterImageUpload_default,
  renderFilterImageUpload: () => renderFilterImageUpload
});
module.exports = __toCommonJS(FilterImageUpload_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_FilterService = require("./FilterService");
var import_client = require("react-dom/client");
const FilterImageUpload = /* @__PURE__ */ __name(({
  onUploadComplete,
  allowMultiple = false,
  height = 300,
  width = "100%",
  className = ""
}) => {
  const [uploadState, setUploadState] = (0, import_react.useState)({
    isUploading: false,
    progress: 0,
    error: null,
    tags: [],
    uploadedImageUrl: null
  });
  const [isDragging, setIsDragging] = (0, import_react.useState)(false);
  const [showConfirmation, setShowConfirmation] = (0, import_react.useState)(false);
  const fileInputRef = (0, import_react.useRef)(null);
  const dropzoneRef = (0, import_react.useRef)(null);
  const filterService = (0, import_react.useRef)(new import_FilterService.FilterService());
  const handleDragEnter = (0, import_react.useCallback)((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const handleDragLeave = (0, import_react.useCallback)((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  const handleDragOver = (0, import_react.useCallback)((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadState.isUploading) {
      setIsDragging(true);
    }
  }, [uploadState.isUploading]);
  const resetUploadState = (0, import_react.useCallback)(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      tags: [],
      uploadedImageUrl: null
    });
    setShowConfirmation(false);
  }, []);
  const processFiles = (0, import_react.useCallback)(async (files) => {
    if (!files.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setUploadState((prev) => ({ ...prev, error: "Please select an image file." }));
      return;
    }
    setUploadState({
      isUploading: true,
      progress: 10,
      error: null,
      tags: [],
      uploadedImageUrl: null
    });
    try {
      const buffer = await readFileAsBuffer(file);
      setUploadState((prev) => ({ ...prev, progress: 30 }));
      const tags = await filterService.current.handleImageTags(buffer);
      setUploadState((prev) => ({ ...prev, progress: 70 }));
      const objectUrl = URL.createObjectURL(file);
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        tags,
        uploadedImageUrl: objectUrl
      });
      if (tags.length > 0) {
        setShowConfirmation(true);
      } else {
        handleConfirmUpload();
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }));
    }
  }, []);
  const handleDrop = (0, import_react.useCallback)((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!uploadState.isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [uploadState.isUploading, processFiles]);
  const handleFileSelect = (0, import_react.useCallback)(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  const handleFileChange = (0, import_react.useCallback)((e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);
  const handleConfirmUpload = (0, import_react.useCallback)(async () => {
    try {
      if (uploadState.uploadedImageUrl) {
        const blob = await fetch(uploadState.uploadedImageUrl).then((r) => r.blob());
        const buffer = await blob.arrayBuffer().then((ab) => Buffer.from(ab));
        const attachment = {
          data: buffer,
          fileName: "uploaded-image.jpg",
          // Default name
          contentType: blob.type
        };
        const success = await filterService.current.handleImageAttachment(attachment);
        if (onUploadComplete) {
          onUploadComplete(success);
        }
        resetUploadState();
      }
    } catch (error) {
      console.error("Error confirming upload:", error);
      setUploadState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Error confirming upload"
      }));
    }
  }, [uploadState.uploadedImageUrl, resetUploadState, onUploadComplete]);
  const handleCancelUpload = (0, import_react.useCallback)(() => {
    if (uploadState.uploadedImageUrl) {
      URL.revokeObjectURL(uploadState.uploadedImageUrl);
    }
    resetUploadState();
  }, [uploadState.uploadedImageUrl, resetUploadState]);
  (0, import_react.useEffect)(() => {
    return () => {
      if (uploadState.uploadedImageUrl) {
        URL.revokeObjectURL(uploadState.uploadedImageUrl);
      }
    };
  }, [uploadState.uploadedImageUrl]);
  const readFileAsBuffer = /* @__PURE__ */ __name((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const buffer = Buffer.from(arrayBuffer);
        resolve(buffer);
      };
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      reader.readAsArrayBuffer(file);
    });
  }, "readFileAsBuffer");
  const renderTagCategories = /* @__PURE__ */ __name((tags) => {
    const categories = {};
    tags.forEach((tag) => {
      const category = tag.categories?.[0] || "Other";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(tag);
    });
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__tags-categories", children: Object.entries(categories).map(([category, categoryTags]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__tag-category", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { className: "filter-image-upload__tag-category-title", children: category }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__tag-list", children: categoryTags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "span",
        {
          className: `filter-image-upload__tag ${tag.isModerationFlag ? "filter-image-upload__tag--warning" : ""}`,
          title: `Confidence: ${tag.confidence.toFixed(1)}%`,
          children: tag.name
        },
        tag.name
      )) })
    ] }, category)) });
  }, "renderTagCategories");
  const getModerationTags = /* @__PURE__ */ __name((tags) => {
    return tags.filter((tag) => tag.isModerationFlag);
  }, "getModerationTags");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `filter-image-upload ${className}`, style: { width }, children: [
    !showConfirmation ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        ref: dropzoneRef,
        className: `filter-image-upload__dropzone ${isDragging ? "filter-image-upload__dropzone--active" : ""} ${uploadState.isUploading ? "filter-image-upload__dropzone--uploading" : ""}`,
        style: { height },
        onDragEnter: handleDragEnter,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        onClick: !uploadState.isUploading ? handleFileSelect : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/*",
              multiple: allowMultiple,
              onChange: handleFileChange,
              style: { display: "none" }
            }
          ),
          uploadState.isUploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__progress", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__progress-bar", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "div",
              {
                className: "filter-image-upload__progress-fill",
                style: { width: `${uploadState.progress}%` }
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__progress-text", children: [
              "Uploading... ",
              uploadState.progress,
              "%"
            ] })
          ] }) : uploadState.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__error", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__error-icon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u274C" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__error-message", children: uploadState.error }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                className: "filter-image-upload__retry-button",
                onClick: (e) => {
                  e.stopPropagation();
                  resetUploadState();
                },
                children: "Try Again"
              }
            )
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__placeholder", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__icon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u{1F4F7}" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__text", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__title", children: "Upload Image" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__subtitle", children: "Drag and drop an image here, or click to select from your device" })
            ] })
          ] })
        ]
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__confirmation", style: { height }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__preview", children: uploadState.uploadedImageUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "img",
        {
          src: uploadState.uploadedImageUrl,
          alt: "Upload preview",
          className: "filter-image-upload__preview-image"
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__tags", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "filter-image-upload__tags-title", children: "Image Content" }),
        uploadState.tags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          renderTagCategories(uploadState.tags),
          getModerationTags(uploadState.tags).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__moderation-warning", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u26A0\uFE0F" }),
            " This image contains potentially sensitive content."
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "filter-image-upload__no-tags", children: "No content detected in this image." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "filter-image-upload__actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "filter-image-upload__button filter-image-upload__button--secondary",
            onClick: handleCancelUpload,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "filter-image-upload__button filter-image-upload__button--primary",
            onClick: handleConfirmUpload,
            children: "Confirm Upload"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { jsx: true, children: `
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
      ` })
  ] });
}, "FilterImageUpload");
const renderFilterImageUpload = /* @__PURE__ */ __name((element, props = {}) => {
  const root = (0, import_client.createRoot)(element);
  root.render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterImageUpload, { ...props }));
  return () => root.unmount();
}, "renderFilterImageUpload");
var FilterImageUpload_default = FilterImageUpload;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FilterImageUpload,
  renderFilterImageUpload
});
