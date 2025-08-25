export interface RawMeta {
  ref: string;
  hash: string;
  size: number;
}

// Raw storage interfaces for the Signals app
import { RawPayload, StorageResult, StorageStats } from '../types';

export interface IRawStore {
  store(payload: RawPayload): Promise<string>;
  getPresignedUrl(ref: string, ttlSec: number): Promise<string>;
  getMetadata(ref: string): Promise<StorageResult>;
  delete(ref: string): Promise<boolean>;
  exists(ref: string): Promise<boolean>;
  getFileSize(ref: string): Promise<number>;
  getStorageStats(): Promise<StorageStats>;
}
