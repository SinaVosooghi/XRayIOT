/**
 * Storage Domain Interface
 *
 * This file defines the core interfaces for the Storage domain,
 * providing abstraction over different storage backends.
 */

// Raw Payload Interface
export interface RawPayload {
  deviceId: string;
  timestamp: Date;
  data: unknown;
  metadata?: Record<string, unknown>;
}

// Storage Statistics Interface
export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
  oldestFile?: Date;
  newestFile?: Date;
}

// Storage Metadata Interface
export interface StorageMetadata {
  id: string;
  filename: string;
  size: number;
  uploadDate: Date;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

// Raw Storage Interface
export interface IRawStore {
  store(payload: RawPayload): Promise<string>;
  get(id: string): Promise<RawPayload | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  getMetadata(id: string): Promise<StorageMetadata | null>;
  getPresignedUrl(id: string, ttlSeconds?: number): Promise<string>;
  getFileSize(id: string): Promise<number>;
  getStorageStats(): Promise<StorageStats>;
}

// Storage Configuration Interface
export interface StorageConfig {
  type: 'gridfs' | 'minio' | 's3';
  bucket?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  useSSL?: boolean;
  presignTtlSec?: number;
}

// Storage Factory Interface
export interface IStorageFactory {
  createStore(config: StorageConfig): IRawStore;
  getDefaultStore(): IRawStore;
}

// Storage Health Check Interface
export interface StorageHealthCheck {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  stats?: StorageStats;
}
