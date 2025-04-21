type FilterServiceMockType = {
  isEnabled: boolean;
  addEventListener: jest.Mock<
    void, 
    [string, (event?: Partial<Event>) => void]
  >;
  removeEventListener: jest.Mock<
    void, 
    [string, (event?: Partial<Event>) => void]
  >;
};

declare global {
  namespace Signal {
    interface Services {
      filterService: FilterServiceMockType;
    }
  }
}

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AttachmentFilterToggle } from '../AttachmentFilterToggle';

// Mock the getIntl function
jest.mock('../../../util/getIntl', () => ({
  getIntl: () => (key: string) => {
    const translations: Record<string, string> = {
      'icu:attachmentFilterToggleLabel': 'Toggle attachment filtering',
      'icu:filterEnabled': 'Filtering On',
      'icu:filterDisabled': 'Filtering Off'
    };
    return translations[key] || key;
  },
}));

describe('AttachmentFilterToggle', () => {
  // Mock localStorage
  let localStorageMock: Record<string, string> = {};
  
  beforeEach(() => {
    // Clear localStorage mock before each test
    localStorageMock = {};
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => localStorageMock[key] || null),
        setItem: jest.fn((key, value) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key) => delete localStorageMock[key]),
        clear: jest.fn(() => { localStorageMock = {}; }),
      },
      writable: true,
    });

    // Mock the Signal.Services.filterService
    const filterServiceMock: FilterServiceMockType = {
      isEnabled: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    Object.defineProperty(window, 'Signal', {
      value: {
        Services: {
          filterService: filterServiceMock,
        },
      },
    });
  });

  it('renders correctly with default props', () => {
    const onToggleMock = jest.fn();
    render(
      <AttachmentFilterToggle isEnabled={false} onToggle={onToggleMock} />
    );
    
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(screen.getByText('Filtering Off')).toBeInTheDocument();
  });

  it('renders correctly when enabled', () => {
    const onToggleMock = jest.fn();
    render(
      <AttachmentFilterToggle isEnabled={true} onToggle={onToggleMock} />
    );
    
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
    expect(screen.getByText('Filtering On')).toBeInTheDocument();
  });

  it('renders correctly when disabled', () => {
    const onToggleMock = jest.fn();
    render(
      <AttachmentFilterToggle isEnabled={false} onToggle={onToggleMock} disabled={true} />
    );
    
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('calls onToggle handler when clicked', () => {
    const onToggleMock = jest.fn();
    render(
      <AttachmentFilterToggle isEnabled={false} onToggle={onToggleMock} />
    );
    
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggleMock).toHaveBeenCalledWith(true);
  });

  it('reads from localStorage on mount if value exists', () => {
    // Set up localStorage with a value before component renders
    localStorageMock['attachmentFilterEnabled'] = 'true';
    
    const onToggleMock = jest.fn();
    render(
      <AttachmentFilterToggle isEnabled={false} onToggle={onToggleMock} />
    );
    
    // onToggle should be called with the value from localStorage
    expect(onToggleMock).toHaveBeenCalledWith(true);
  });

  it('writes to localStorage when toggled', () => {
    const onToggleMock = jest.fn();
    render(
      <AttachmentFilterToggle isEnabled={false} onToggle={onToggleMock} />
    );
    
    fireEvent.click(screen.getByRole('switch'));
    expect(window.localStorage.setItem).toHaveBeenCalledWith('attachmentFilterEnabled', 'true');
  });

  it('syncs with FilterService when available', () => {
    // Setup mock function for addEventListener
    const mockAddEventListener = jest.fn<
      void, 
      [string, (event?: Partial<Event>) => void]
    >((event, callback) => {
      // Simulate the callback being called with updated service state
      if (event === 'change') {
        window.Signal.Services.filterService.isEnabled = true;
        callback({} as Event);
      }
    });

    // Update mock to use our implementation
    window.Signal.Services.filterService.addEventListener = mockAddEventListener;

    const onToggleMock = jest.fn();
    render(
      <AttachmentFilterToggle isEnabled={false} onToggle={onToggleMock} />
    );

    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(window.Signal.Services.filterService.removeEventListener)
      .toHaveBeenCalledWith(
        'change', 
        expect.any(Function)
      );
  });

  it('applies the provided className', () => {
    const onToggleMock = jest.fn();
    render(
      <AttachmentFilterToggle 
        isEnabled={false} 
        onToggle={onToggleMock} 
        className="custom-class"
      />
    );
    
    expect(screen.getByRole('switch').parentElement).toHaveClass('AttachmentFilterToggle');
    expect(screen.getByRole('switch').parentElement).toHaveClass('custom-class');
  });
});
