import { EventHandler } from '../textsecure/EventTarget';
import type EventTarget from '../textsecure/EventTarget';

export interface ContentHashData {
  hash: string;
  contentType: 'image' | 'text' | 'video';
  timestamp: number;
  content?: string;
}

export interface FilterSettings {
  isEnabled: boolean;
  isGlobalEnabled: boolean;
  similarityThreshold: number;
}

export interface FilterService extends EventTarget {
  isEnabled: boolean;
  isGlobalEnabled: boolean;
  similarityThreshold: number;
  
  DEFAULT_SETTINGS?: {
    enabled: boolean;
    global: boolean;
    threshold: number;
  };

  addEventListener(eventName: string, callback: EventHandler): void;
  removeEventListener(eventName: string, callback: EventHandler): void;
  dispatchEvent(ev: Event): Array<unknown>;

  handleImageAttachment(attachment: { data: ArrayBuffer }): Promise<boolean>;
  handleTextMessage(text: string): Promise<boolean>;
  handleVideoAttachment(attachment: any): Promise<boolean>;

  // Private methods that may be useful for typing
  loadSettings?(): Promise<void>;
  checkGlobalDuplicate?(contentHash: string, contentType: 'image' | 'text' | 'video'): Promise<boolean>;
  saveToGlobalStore?(contentHash: string, contentType: 'image' | 'text' | 'video'): Promise<void>;
}

export type Props = {
  isEnabled: boolean;
  onToggle: (isEnabled: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Declare global window object with Signal namespace
 */
declare global {
  interface Window {
    Signal: {
      Services: {
        filterService: FilterService;
      };
      Data: {
        getFilterSettings(): Promise<FilterSettings | undefined>;
        getContentHashes(contentType: string): Promise<Array<ContentHashData>>;
        saveContentHash(data: ContentHashData): Promise<void>;
      };
    };
  }
}

export { default } from '../components/attachment/AttachmentFilterToggle';