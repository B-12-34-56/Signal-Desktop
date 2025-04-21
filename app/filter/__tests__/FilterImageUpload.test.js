"use strict";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var import_jsx_runtime = require("react/jsx-runtime");
var import_react2 = require("@testing-library/react");
var import_jest_dom = require("@testing-library/jest-dom");
var import_FilterImageUpload = require("../FilterImageUpload");
var import_FilterService = require("../FilterService");
global.Buffer = {
  from: jest.fn((arrayBuffer) => ({
    // Simple mock implementation that returns itself
    arrayBuffer: /* @__PURE__ */ __name(() => Promise.resolve(arrayBuffer), "arrayBuffer")
  }))
};
URL.createObjectURL = jest.fn(() => "mock-object-url");
URL.revokeObjectURL = jest.fn();
jest.mock("../FilterService", () => {
  return {
    FilterService: jest.fn().mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }))
  };
});
const createMockFile = /* @__PURE__ */ __name(() => {
  const file = new File(["mock-image-data"], "test-image.jpg", { type: "image/jpeg" });
  return file;
}, "createMockFile");
const createDragEvent = /* @__PURE__ */ __name((type) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      files: [createMockFile()],
      items: [
        {
          kind: "file",
          type: "image/jpeg",
          getAsFile: /* @__PURE__ */ __name(() => createMockFile(), "getAsFile")
        }
      ],
      types: ["Files"]
    }
  });
  return event;
}, "createDragEvent");
describe("FilterImageUpload component", () => {
  let mockFilterService;
  beforeEach(() => {
    jest.clearAllMocks();
    mockFilterService = new import_FilterService.FilterService();
  });
  it("renders initial upload state correctly", () => {
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    expect(import_react2.screen.getByText("Upload Image")).toBeInTheDocument();
    expect(import_react2.screen.getByText("Drag and drop an image here, or click to select from your device")).toBeInTheDocument();
    expect(import_react2.screen.getByText("\u{1F4F7}")).toBeInTheDocument();
  });
  it("triggers file input when dropzone is clicked", async () => {
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const dropzone = import_react2.screen.getByText("Upload Image").closest("div");
    expect(dropzone).toBeInTheDocument();
    const clickSpy = jest.spyOn(HTMLInputElement.prototype, "click");
    if (dropzone) {
      import_react2.fireEvent.click(dropzone);
    }
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
  it("handles drag and drop events correctly", async () => {
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const dropzone = import_react2.screen.getByText("Upload Image").closest("div");
    expect(dropzone).toBeInTheDocument();
    if (dropzone) {
      import_react2.fireEvent.dragEnter(dropzone, createDragEvent("dragenter"));
      expect(dropzone.classList.contains("filter-image-upload__dropzone--active")).toBe(true);
      import_react2.fireEvent.dragLeave(dropzone, createDragEvent("dragleave"));
      expect(dropzone.classList.contains("filter-image-upload__dropzone--active")).toBe(false);
      import_react2.fireEvent.dragOver(dropzone, createDragEvent("dragover"));
      expect(dropzone.classList.contains("filter-image-upload__dropzone--active")).toBe(true);
    }
  });
  it("displays uploading progress when file is dropped", async () => {
    import_FilterService.FilterService.mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const dropzone = import_react2.screen.getByText("Upload Image").closest("div");
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      onerror: null,
      result: new ArrayBuffer(8)
    };
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance);
    if (dropzone) {
      await (0, import_react2.act)(async () => {
        import_react2.fireEvent.drop(dropzone, createDragEvent("drop"));
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } });
        }
      });
    }
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText(/Uploading/i)).toBeInTheDocument();
    });
  });
  it("handles file selection through input", async () => {
    const file = createMockFile();
    import_FilterService.FilterService.mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const dropzone = import_react2.screen.getByText("Upload Image").closest("div");
    const fileInput = document.querySelector('input[type="file"]');
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      onerror: null,
      result: new ArrayBuffer(8)
    };
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance);
    if (fileInput) {
      await (0, import_react2.act)(async () => {
        import_react2.fireEvent.change(fileInput, { target: { files: [file] } });
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } });
        }
      });
    }
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText("Image Content")).toBeInTheDocument();
      expect(import_react2.screen.getByText("Cat")).toBeInTheDocument();
    });
  });
  it("displays error message when file upload fails", async () => {
    import_FilterService.FilterService.mockImplementation(() => ({
      handleImageTags: jest.fn().mockRejectedValue(new Error("Upload failed")),
      handleImageAttachment: jest.fn().mockResolvedValue(false)
    }));
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const dropzone = import_react2.screen.getByText("Upload Image").closest("div");
    const fileInput = document.querySelector('input[type="file"]');
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      onerror: null,
      result: new ArrayBuffer(8)
    };
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance);
    if (fileInput) {
      await (0, import_react2.act)(async () => {
        import_react2.fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } });
        }
      });
    }
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText("Upload failed")).toBeInTheDocument();
      expect(import_react2.screen.getByText("Try Again")).toBeInTheDocument();
    });
  });
  it("allows user to confirm upload with detected tags", async () => {
    const mockOnUploadComplete = jest.fn();
    import_FilterService.FilterService.mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] },
        { name: "Pet", confidence: 95, categories: ["Animals"] }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, { onUploadComplete: mockOnUploadComplete }));
    const fileInput = document.querySelector('input[type="file"]');
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      onerror: null,
      result: new ArrayBuffer(8)
    };
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance);
    if (fileInput) {
      await (0, import_react2.act)(async () => {
        import_react2.fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } });
        }
      });
    }
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText("Image Content")).toBeInTheDocument();
      expect(import_react2.screen.getByText("Cat")).toBeInTheDocument();
      expect(import_react2.screen.getByText("Pet")).toBeInTheDocument();
      expect(import_react2.screen.getByText("Confirm Upload")).toBeInTheDocument();
    });
    const confirmButton = import_react2.screen.getByText("Confirm Upload");
    await (0, import_react2.act)(async () => {
      import_react2.fireEvent.click(confirmButton);
    });
    await (0, import_react2.waitFor)(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith(true);
    });
  });
  it("allows user to cancel upload", async () => {
    import_FilterService.FilterService.mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const fileInput = document.querySelector('input[type="file"]');
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      onerror: null,
      result: new ArrayBuffer(8)
    };
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance);
    if (fileInput) {
      await (0, import_react2.act)(async () => {
        import_react2.fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } });
        }
      });
    }
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText("Image Content")).toBeInTheDocument();
    });
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    const cancelButton = import_react2.screen.getByText("Cancel");
    await (0, import_react2.act)(async () => {
      import_react2.fireEvent.click(cancelButton);
    });
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText("Upload Image")).toBeInTheDocument();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-object-url");
    });
  });
  it("displays moderation warning for content with moderation flags", async () => {
    import_FilterService.FilterService.mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] },
        { name: "Violence", confidence: 85, isModerationFlag: true }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const fileInput = document.querySelector('input[type="file"]');
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      onerror: null,
      result: new ArrayBuffer(8)
    };
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance);
    if (fileInput) {
      await (0, import_react2.act)(async () => {
        import_react2.fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } });
        }
      });
    }
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText("Image Content")).toBeInTheDocument();
      expect(import_react2.screen.getByText("Cat")).toBeInTheDocument();
      expect(import_react2.screen.getByText("Violence")).toBeInTheDocument();
      expect(import_react2.screen.getByText(/This image contains potentially sensitive content/)).toBeInTheDocument();
    });
  });
  it("handles non-image files correctly", async () => {
    const nonImageFile = new File(["test-data"], "document.pdf", { type: "application/pdf" });
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      await (0, import_react2.act)(async () => {
        import_react2.fireEvent.change(fileInput, { target: { files: [nonImageFile] } });
      });
    }
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText("Please select an image file.")).toBeInTheDocument();
    });
  });
  it("cleans up object URL on component unmount", async () => {
    import_FilterService.FilterService.mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    const { unmount } = (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const fileInput = document.querySelector('input[type="file"]');
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      onerror: null,
      result: new ArrayBuffer(8)
    };
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance);
    if (fileInput) {
      await (0, import_react2.act)(async () => {
        import_react2.fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } });
        }
      });
    }
    await (0, import_react2.waitFor)(() => {
      expect(import_react2.screen.getByText("Image Content")).toBeInTheDocument();
    });
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-object-url");
  });
  it("tests responsive behavior by checking CSS classes", async () => {
    (0, import_react2.render)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterImageUpload.FilterImageUpload, {}));
    const container = import_react2.screen.getByText("Upload Image").closest(".filter-image-upload");
    expect(container).toBeInTheDocument();
    if (container) {
      expect(getComputedStyle(container).getPropertyValue("--filter-image-upload-responsive")).toBeFalsy();
    }
  });
});
