// MongoDB types and interfaces for the application
import { Document } from 'mongoose';

// MongoDB Document Types
export interface BaseDocument extends Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimestampedDocument extends BaseDocument {
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Query Types
export interface MongoFilter {
  _id?: string;
  createdAt?: Date | { $gte?: Date; $lte?: Date };
  updatedAt?: Date | { $gte?: Date; $lte?: Date };
  [key: string]: unknown;
}

export interface MongoUpdate<T = unknown> {
  $set?: Partial<T>;
  $unset?: Partial<Record<keyof T, 1 | '' | true | null>>;
  $inc?: Partial<Record<keyof T, number>>;
  $push?: Partial<Record<keyof T, unknown>>;
  $pull?: Partial<Record<keyof T, unknown>>;
  $addToSet?: Partial<Record<keyof T, unknown>>;
  [key: string]: unknown;
}

export interface MongoOptions {
  lean?: boolean;
  projection?: Record<string, 0 | 1>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  populate?: string | string[] | Record<string, unknown>;
  [key: string]: unknown;
}

// MongoDB Aggregation Types
export interface MongoAggregationStage {
  $match?: MongoFilter;
  $group?: Record<string, unknown>;
  $sort?: Record<string, 1 | -1>;
  $limit?: number;
  $skip?: number;
  $project?: Record<string, 0 | 1>;
  $lookup?: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
  };
  $unwind?: string | { path: string; preserveNullAndEmptyArrays?: boolean };
  $facet?: Record<string, MongoAggregationStage[]>;
  [key: string]: unknown;
}

export interface MongoAggregationOptions {
  allowDiskUse?: boolean;
  cursor?: { batchSize: number };
  hint?: string | Record<string, unknown>;
  maxTimeMS?: number;
  bypassDocumentValidation?: boolean;
}

// MongoDB Result Types
export interface MongoResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  affectedRows?: number;
}

export interface MongoPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MongoAggregationResult<T> {
  success: boolean;
  data: T[];
  count: number;
  error?: string;
}

// MongoDB Index Types
export interface MongoIndex {
  key: Record<string, 1 | -1 | '2dsphere' | 'text'>;
  name: string;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, unknown>;
}

export interface MongoIndexOptions {
  background?: boolean;
  unique?: boolean;
  sparse?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, unknown>;
  collation?: {
    locale: string;
    strength?: number;
    caseLevel?: boolean;
    caseFirst?: string;
    numericOrdering?: boolean;
    alternate?: string;
    maxVariable?: string;
  };
}

// MongoDB Connection Types
export interface MongoConnectionOptions {
  uri: string;
  dbName: string;
  options?: {
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTimeMS?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    connectTimeoutMS?: number;
    retryWrites?: boolean;
    retryReads?: boolean;
    readPreference?: string;
    writeConcern?: {
      w: number | string;
      j?: boolean;
      wtimeout?: number;
    };
  };
}

export interface MongoConnectionStatus {
  connected: boolean;
  readyState: number;
  host: string;
  port: number;
  name: string;
  error?: string;
}

// MongoDB Transaction Types
export interface MongoTransactionOptions {
  readConcern?: {
    level: 'local' | 'majority' | 'linearizable' | 'snapshot';
  };
  writeConcern?: {
    w: number | string;
    j?: boolean;
    wtimeout?: number;
  };
  readPreference?: string;
  maxCommitTimeMS?: number;
}

export interface MongoTransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  sessionId?: string;
}

// MongoDB Change Stream Types
export interface MongoChangeStreamOptions {
  fullDocument?: 'default' | 'updateLookup' | 'whenAvailable' | 'required';
  fullDocumentBeforeChange?: 'off' | 'default' | 'whenAvailable' | 'required';
  resumeAfter?: Record<string, unknown>;
  startAtOperationTime?: Date;
  maxAwaitTimeMS?: number;
  batchSize?: number;
  collation?: Record<string, unknown>;
}

export interface MongoChangeEvent<T = unknown> {
  _id: Record<string, unknown>;
  operationType:
    | 'insert'
    | 'update'
    | 'replace'
    | 'delete'
    | 'drop'
    | 'rename'
    | 'dropDatabase'
    | 'invalidate';
  fullDocument?: T;
  fullDocumentBeforeChange?: T;
  ns: {
    db: string;
    coll: string;
  };
  documentKey: Record<string, unknown>;
  updateDescription?: {
    updatedFields: Record<string, unknown>;
    removedFields: string[];
    truncatedArrays: Array<{ field: string; newSize: number }>;
  };
  clusterTime?: Date;
  txnNumber?: number;
  lsid?: Record<string, unknown>;
}

// MongoDB GridFS Types
export interface GridFSFile {
  _id: string;
  filename: string;
  length: number;
  chunkSize: number;
  uploadDate: Date;
  metadata?: Record<string, unknown>;
  contentType?: string;
  aliases?: string[];
  md5?: string;
}

export interface GridFSChunk {
  _id: string;
  files_id: string;
  n: number;
  data: Buffer;
}

export interface GridFSUploadOptions {
  filename: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
  aliases?: string[];
  chunkSizeBytes?: number;
}

export interface GridFSDownloadOptions {
  start?: number;
  end?: number;
  revision?: number;
}

// MongoDB Model Types
export interface MongoModel<T extends Document> {
  findByIdAndUpdate(id: string, update: MongoUpdate<T>, options?: MongoOptions): Promise<T | null>;

  findOneAndUpdate(
    filter: MongoFilter,
    update: MongoUpdate<T>,
    options?: MongoOptions
  ): Promise<T | null>;

  findOneAndDelete(filter: MongoFilter, options?: MongoOptions): Promise<T | null>;

  aggregate(
    pipeline: MongoAggregationStage[],
    options?: MongoAggregationOptions
  ): Promise<MongoAggregationResult<T>>;

  createIndexes(indexes: MongoIndex[], options?: MongoIndexOptions): Promise<string[]>;

  dropIndexes(indexes?: string | string[]): Promise<Record<string, unknown>>;
}

// MongoDB Repository Interface
export interface IMongoRepository<T extends Document> {
  findById(id: string, options?: MongoOptions): Promise<T | null>;
  findOne(filter: MongoFilter, options?: MongoOptions): Promise<T | null>;
  find(filter: MongoFilter, options?: MongoOptions): Promise<T[]>;
  findPaginated(
    filter: MongoFilter,
    page: number,
    limit: number,
    options?: MongoOptions
  ): Promise<MongoPaginatedResult<T>>;

  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<T[]>;

  updateById(id: string, update: MongoUpdate<T>): Promise<T | null>;
  updateOne(filter: MongoFilter, update: MongoUpdate<T>): Promise<T | null>;
  updateMany(filter: MongoFilter, update: MongoUpdate<T>): Promise<number>;

  deleteById(id: string): Promise<boolean>;
  deleteOne(filter: MongoFilter): Promise<boolean>;
  deleteMany(filter: MongoFilter): Promise<number>;

  count(filter: MongoFilter): Promise<number>;
  exists(filter: MongoFilter): Promise<boolean>;

  aggregate(
    pipeline: MongoAggregationStage[],
    options?: MongoAggregationOptions
  ): Promise<MongoAggregationResult<T>>;

  createIndexes(indexes: MongoIndex[]): Promise<string[]>;
  dropIndexes(indexes?: string | string[]): Promise<Record<string, unknown>>;
}

// MongoDB Health Check Types
export interface MongoHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: {
    connection: MongoConnectionStatus;
    collections: string[];
    indexes: Record<string, MongoIndex[]>;
    stats: {
      totalDocuments: number;
      totalSize: number;
      avgDocumentSize: number;
    };
  };
  timestamp: Date;
  responseTime: number;
}

// MongoDB Migration Types
export interface MongoMigration {
  version: number;
  name: string;
  description: string;
  up: (db: Record<string, unknown>) => Promise<void>;
  down: (db: Record<string, unknown>) => Promise<void>;
  timestamp: Date;
}

export interface MongoMigrationResult {
  success: boolean;
  version: number;
  name: string;
  error?: string;
  duration: number;
  timestamp: Date;
}

// MongoDB Backup Types
export interface MongoBackupOptions {
  collections?: string[];
  excludeCollections?: string[];
  gzip?: boolean;
  archive?: boolean;
  query?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
}

export interface MongoBackupResult {
  success: boolean;
  backupPath: string;
  size: number;
  collections: string[];
  timestamp: Date;
  duration: number;
  error?: string;
}

// MongoDB Restore Types
export interface MongoRestoreOptions {
  drop?: boolean;
  dropDatabase?: boolean;
  clean?: boolean;
  noIndexRestore?: boolean;
  noOptionsRestore?: boolean;
  keepIndexVersion?: boolean;
  maintainInsertionOrder?: boolean;
  numParallelCollections?: number;
  numInsertionWorkersPerCollection?: number;
}

export interface MongoRestoreResult {
  success: boolean;
  restoredCollections: string[];
  restoredDocuments: number;
  restoredIndexes: number;
  timestamp: Date;
  duration: number;
  error?: string;
}
