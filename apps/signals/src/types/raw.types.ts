// Raw storage types for the Signals app
import { RawPayload, StorageResult, StorageStats } from '@iotp/shared-types';

// Raw Storage Configuration
export interface RawStorageConfig {
  type: 'gridfs' | 's3' | 'local' | 'minio';
  bucketName: string;
  compression: boolean;
  encryption: boolean;
  retention: {
    enabled: boolean;
    days: number;
    archive: boolean;
  };
  deduplication: {
    enabled: boolean;
    algorithm: 'sha256' | 'md5' | 'crc32';
  };
  metadata: {
    enabled: boolean;
    fields: string[];
  };
}

// Raw Storage Operations
export interface RawStorageOperations {
  store(payload: RawPayload, options?: RawStorageOptions): Promise<StorageResult>;
  retrieve(ref: string, options?: RawStorageRetrieveOptions): Promise<RawPayload | null>;
  delete(ref: string): Promise<boolean>;
  exists(ref: string): Promise<boolean>;
  getMetadata(ref: string): Promise<StorageResult>;
  getFileSize(ref: string): Promise<number>;
  getPresignedUrl(ref: string, ttlSec: number): Promise<string>;
  getStorageStats(): Promise<StorageStats>;
}

// Raw Storage Options
export interface RawStorageOptions {
  compression?: boolean;
  encryption?: boolean;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
  lifecycle?: {
    expiration?: Date;
    transition?: {
      storageClass: string;
      transitionDate: Date;
    };
  };
}

export interface RawStorageRetrieveOptions {
  decompress?: boolean;
  decrypt?: boolean;
  includeMetadata?: boolean;
  range?: {
    start: number;
    end: number;
  };
}

// Raw Storage Events
export interface RawStorageEvent {
  type: 'stored' | 'retrieved' | 'deleted' | 'error';
  ref: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface RawStorageEventListener {
  onStored(event: RawStorageEvent): void;
  onRetrieved(event: RawStorageEvent): void;
  onDeleted(event: RawStorageEvent): void;
  onError(event: RawStorageEvent): void;
}

// Raw Storage Metrics
export interface RawStorageMetrics {
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
  compressionRatio: number;
  storageEfficiency: number;
  retrievalLatency: number;
  errorRate: number;
  lastOperationAt: Date;
}

// Raw Storage Health Check
export interface RawStorageHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: {
    connection: boolean;
    bucket: boolean;
    permissions: boolean;
    performance: {
      writeLatency: number;
      readLatency: number;
      errorRate: number;
    };
    storage: {
      used: number;
      available: number;
      utilization: number;
    };
  };
  timestamp: Date;
  responseTime: number;
}

// Raw Storage Batch Operations
export interface RawStorageBatchOperation {
  operation: 'store' | 'delete' | 'retrieve';
  payload?: RawPayload;
  ref?: string;
  options?: RawStorageOptions;
}

export interface RawStorageBatchResult {
  success: boolean;
  operations: Array<{
    operation: RawStorageBatchOperation;
    success: boolean;
    result?: StorageResult;
    error?: string;
  }>;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  executionTime: number;
}

// Raw Storage Compression
export interface CompressionConfig {
  algorithm: 'gzip' | 'brotli' | 'lz4' | 'zstd';
  level: number;
  threshold: number; // Minimum size to compress
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  algorithm: string;
  level: number;
}

// Raw Storage Encryption
export interface EncryptionConfig {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  keySource: 'kms' | 'local' | 'vault';
  keyId?: string;
}

export interface EncryptionResult {
  encrypted: boolean;
  algorithm: string;
  keyId?: string;
  iv?: Buffer;
  tag?: Buffer;
}

// Raw Storage Deduplication

export interface DeduplicationResult {
  deduplicated: boolean;
  originalRef?: string;
  algorithm: string;
  hash: string;
  savings: number;
}

// Raw Storage Retention
export interface RetentionConfig {
  enabled: boolean;
  policy: 'delete' | 'archive' | 'move';
  days: number;
  archiveLocation?: string;
  moveStorageClass?: string;
}

export interface RetentionResult {
  action: 'none' | 'deleted' | 'archived' | 'moved';
  timestamp: Date;
  details?: Record<string, unknown>;
}

// Raw Storage Search
export interface RawStorageSearchQuery {
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
  sizeRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
  contentType?: string;
  hash?: string;
}

export interface RawStorageSearchResult {
  files: Array<{
    ref: string;
    filename: string;
    size: number;
    uploadDate: Date;
    metadata?: Record<string, unknown>;
    tags?: Record<string, string>;
  }>;
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Raw Storage Migration
export interface RawStorageMigration {
  from: RawStorageConfig;
  to: RawStorageConfig;
  options: {
    batchSize: number;
    parallel: boolean;
    validate: boolean;
    dryRun: boolean;
  };
}

export interface RawStorageMigrationResult {
  success: boolean;
  migratedFiles: number;
  failedFiles: number;
  totalSize: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  errors: string[];
}

// Raw Storage Backup
export interface RawStorageBackup {
  config: RawStorageConfig;
  options: {
    includeMetadata: boolean;
    includeTags: boolean;
    compression: boolean;
    encryption: boolean;
    incremental: boolean;
  };
}

export interface RawStorageBackupResult {
  success: boolean;
  backupPath: string;
  backupSize: number;
  fileCount: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  error?: string;
}

// Raw Storage Restore
export interface RawStorageRestore {
  config: RawStorageConfig;
  backupPath: string;
  options: {
    overwrite: boolean;
    validate: boolean;
    parallel: boolean;
    batchSize: number;
  };
}

export interface RawStorageRestoreResult {
  success: boolean;
  restoredFiles: number;
  failedFiles: number;
  totalSize: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  errors: string[];
}
