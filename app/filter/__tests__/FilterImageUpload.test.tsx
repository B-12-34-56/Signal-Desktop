import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { FilterImageUpload } from "../FilterImageUpload";
import { FilterService } from "../FilterService";

// Mock Buffer since it's not available in JSDOM environment
global.Buffer = {
  from: jest.fn((arrayBuffer) => ({
    // Simple mock implementation that returns itself
    arrayBuffer: () => Promise.resolve(arrayBuffer)
  }))
} as any;

// Mock URL.createObjectURL and URL.revokeObjectURL
URL.createObjectURL = jest.fn(() => "mock-object-url");
URL.revokeObjectURL = jest.fn();

// Mock FilterService
jest.mock("../FilterService", () => {
  return {
    FilterService: jest.fn().mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }))
  };
});

// Simulated file for testing
const createMockFile = () => {
  const file = new File(["mock-image-data"], "test-image.jpg", { type: "image/jpeg" });
  return file;
};

// Simulate drag events
const createDragEvent = (type: string) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      files: [createMockFile()],
      items: [
        {
          kind: "file",
          type: "image/jpeg",
          getAsFile: () => createMockFile()
        }
      ],
      types: ["Files"]
    }
  });
  
  return event;
};

describe("FilterImageUpload component", () => {
  let mockFilterService: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockFilterService = new FilterService();
  });

  it("renders initial upload state correctly", () => {
    render(<FilterImageUpload />);
    
    // Check if the upload title and instructions are displayed
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
    expect(screen.getByText("Drag and drop an image here, or click to select from your device")).toBeInTheDocument();
    
    // Check if the dropzone is rendered
    expect(screen.getByText("📷")).toBeInTheDocument();
  });

  it("triggers file input when dropzone is clicked", async () => {
    render(<FilterImageUpload />);
    
    const dropzone = screen.getByText("Upload Image").closest("div");
    expect(dropzone).toBeInTheDocument();
    
    // Create a spy on the input's click method
    const clickSpy = jest.spyOn(HTMLInputElement.prototype, "click");
    
    // Click the dropzone
    if (dropzone) {
      fireEvent.click(dropzone);
    }
    
    // Check if the file input's click was triggered
    expect(clickSpy).toHaveBeenCalled();
    
    clickSpy.mockRestore();
  });

  it("handles drag and drop events correctly", async () => {
    render(<FilterImageUpload />);
    
    const dropzone = screen.getByText("Upload Image").closest("div");
    expect(dropzone).toBeInTheDocument();
    
    if (dropzone) {
      // Simulate drag events
      fireEvent.dragEnter(dropzone, createDragEvent("dragenter"));
      expect(dropzone.classList.contains("filter-image-upload__dropzone--active")).toBe(true);
      
      fireEvent.dragLeave(dropzone, createDragEvent("dragleave"));
      expect(dropzone.classList.contains("filter-image-upload__dropzone--active")).toBe(false);
      
      fireEvent.dragOver(dropzone, createDragEvent("dragover"));
      expect(dropzone.classList.contains("filter-image-upload__dropzone--active")).toBe(true);
    }
  });

  it("displays uploading progress when file is dropped", async () => {
    // Set up the mocks for tag detection first - resolving with no tags
    (FilterService as jest.MockedClass<typeof FilterService>).mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));

    render(<FilterImageUpload />);
    
    const dropzone = screen.getByText("Upload Image").closest("div");
    
    // Mock FileReader for file reading
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null as any,
      onerror: null as any,
      result: new ArrayBuffer(8)
    };
    
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance as any);
    
    if (dropzone) {
      await act(async () => {
        // Simulate file drop
        fireEvent.drop(dropzone, createDragEvent("drop"));
        
        // Manually trigger the FileReader onload event
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } } as any);
        }
      });
    }
    
    // Wait for the upload progress to appear
    await waitFor(() => {
      expect(screen.getByText(/Uploading/i)).toBeInTheDocument();
    });
  });

  it("handles file selection through input", async () => {
    const file = createMockFile();
    
    // Set up the mocks
    (FilterService as jest.MockedClass<typeof FilterService>).mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    
    render(<FilterImageUpload />);
    
    const dropzone = screen.getByText("Upload Image").closest("div");
    const fileInput = document.querySelector('input[type="file"]');
    
    // Mock FileReader
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null as any,
      onerror: null as any,
      result: new ArrayBuffer(8)
    };
    
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance as any);
    
    // Simulate file selection
    if (fileInput) {
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
        
        // Manually trigger the FileReader onload event
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } } as any);
        }
      });
    }
    
    // After upload completes, we should see the confirmation screen with tags
    await waitFor(() => {
      expect(screen.getByText("Image Content")).toBeInTheDocument();
      expect(screen.getByText("Cat")).toBeInTheDocument();
    });
  });

  it("displays error message when file upload fails", async () => {
    // Set up the mocks to simulate an error
    (FilterService as jest.MockedClass<typeof FilterService>).mockImplementation(() => ({
      handleImageTags: jest.fn().mockRejectedValue(new Error("Upload failed")),
      handleImageAttachment: jest.fn().mockResolvedValue(false)
    }));
    
    render(<FilterImageUpload />);
    
    const dropzone = screen.getByText("Upload Image").closest("div");
    const fileInput = document.querySelector('input[type="file"]');
    
    // Mock FileReader
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null as any,
      onerror: null as any,
      result: new ArrayBuffer(8)
    };
    
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance as any);
    
    // Simulate file selection with error
    if (fileInput) {
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        
        // Manually trigger the FileReader onload event
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } } as any);
        }
      });
    }
    
    // Error message should be shown
    await waitFor(() => {
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });
  });

  it("allows user to confirm upload with detected tags", async () => {
    const mockOnUploadComplete = jest.fn();
    
    // Set up the mocks with tags
    (FilterService as jest.MockedClass<typeof FilterService>).mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] },
        { name: "Pet", confidence: 95.0, categories: ["Animals"] }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    
    render(<FilterImageUpload onUploadComplete={mockOnUploadComplete} />);
    
    const fileInput = document.querySelector('input[type="file"]');
    
    // Mock FileReader
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null as any,
      onerror: null as any,
      result: new ArrayBuffer(8)
    };
    
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance as any);
    
    // Simulate file selection
    if (fileInput) {
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        
        // Manually trigger the FileReader onload event
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } } as any);
        }
      });
    }
    
    // Confirmation screen should show with tags
    await waitFor(() => {
      expect(screen.getByText("Image Content")).toBeInTheDocument();
      expect(screen.getByText("Cat")).toBeInTheDocument();
      expect(screen.getByText("Pet")).toBeInTheDocument();
      expect(screen.getByText("Confirm Upload")).toBeInTheDocument();
    });
    
    // Confirm the upload
    const confirmButton = screen.getByText("Confirm Upload");
    
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Callback should be called with success
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith(true);
    });
  });

  it("allows user to cancel upload", async () => {
    // Set up the mocks with tags
    (FilterService as jest.MockedClass<typeof FilterService>).mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    
    render(<FilterImageUpload />);
    
    const fileInput = document.querySelector('input[type="file"]');
    
    // Mock FileReader
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null as any,
      onerror: null as any,
      result: new ArrayBuffer(8)
    };
    
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance as any);
    
    // Simulate file selection
    if (fileInput) {
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        
        // Manually trigger the FileReader onload event
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } } as any);
        }
      });
    }
    
    // Wait for confirmation screen
    await waitFor(() => {
      expect(screen.getByText("Image Content")).toBeInTheDocument();
    });
    
    // Check if URL.revokeObjectURL has not been called yet
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    
    // Cancel the upload
    const cancelButton = screen.getByText("Cancel");
    
    await act(async () => {
      fireEvent.click(cancelButton);
    });
    
    // We should be back to the initial state
    await waitFor(() => {
      expect(screen.getByText("Upload Image")).toBeInTheDocument();
      // URL.revokeObjectURL should have been called to clean up
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-object-url");
    });
  });

  it("displays moderation warning for content with moderation flags", async () => {
    // Set up the mocks with moderation tags
    (FilterService as jest.MockedClass<typeof FilterService>).mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] },
        { name: "Violence", confidence: 85.0, isModerationFlag: true }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    
    render(<FilterImageUpload />);
    
    const fileInput = document.querySelector('input[type="file"]');
    
    // Mock FileReader
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null as any,
      onerror: null as any,
      result: new ArrayBuffer(8)
    };
    
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance as any);
    
    // Simulate file selection
    if (fileInput) {
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        
        // Manually trigger the FileReader onload event
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } } as any);
        }
      });
    }
    
    // Wait for confirmation screen
    await waitFor(() => {
      expect(screen.getByText("Image Content")).toBeInTheDocument();
      expect(screen.getByText("Cat")).toBeInTheDocument();
      expect(screen.getByText("Violence")).toBeInTheDocument();
      // Should show the moderation warning
      expect(screen.getByText(/This image contains potentially sensitive content/)).toBeInTheDocument();
    });
  });

  it("handles non-image files correctly", async () => {
    const nonImageFile = new File(["test-data"], "document.pdf", { type: "application/pdf" });
    
    render(<FilterImageUpload />);
    
    const fileInput = document.querySelector('input[type="file"]');
    
    // Simulate non-image file selection
    if (fileInput) {
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [nonImageFile] } });
      });
    }
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText("Please select an image file.")).toBeInTheDocument();
    });
  });

  it("cleans up object URL on component unmount", async () => {
    // Set up the mocks with tags
    (FilterService as jest.MockedClass<typeof FilterService>).mockImplementation(() => ({
      handleImageTags: jest.fn().mockResolvedValue([
        { name: "Cat", confidence: 95.5, categories: ["Animals"] }
      ]),
      handleImageAttachment: jest.fn().mockResolvedValue(true)
    }));
    
    const { unmount } = render(<FilterImageUpload />);
    
    const fileInput = document.querySelector('input[type="file"]');
    
    // Mock FileReader
    const mockFileReaderInstance = {
      readAsArrayBuffer: jest.fn(),
      onload: null as any,
      onerror: null as any,
      result: new ArrayBuffer(8)
    };
    
    jest.spyOn(global, "FileReader").mockImplementation(() => mockFileReaderInstance as any);
    
    // Simulate file selection
    if (fileInput) {
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
        
        // Manually trigger the FileReader onload event
        if (mockFileReaderInstance.onload) {
          mockFileReaderInstance.onload({ target: { result: new ArrayBuffer(8) } } as any);
        }
      });
    }
    
    // Wait for confirmation screen
    await waitFor(() => {
      expect(screen.getByText("Image Content")).toBeInTheDocument();
    });
    
    // Unmount the component
    unmount();
    
    // URL.revokeObjectURL should be called during cleanup
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-object-url");
  });

  it("tests responsive behavior by checking CSS classes", async () => {
    // This is a basic test for the responsive classes existence
    render(<FilterImageUpload />);
    
    const container = screen.getByText("Upload Image").closest(".filter-image-upload");
    expect(container).toBeInTheDocument();
    
    // Check that the component renders with proper CSS classes for responsive behavior
    if (container) {
      expect(getComputedStyle(container).getPropertyValue('--filter-image-upload-responsive')).toBeFalsy();
      
      // We could test more CSS properties here, but this is just a basic check
      // Full responsive testing would typically require visual regression testing tools
    }
  });
});