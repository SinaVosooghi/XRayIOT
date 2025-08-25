// MongoDB types and interfaces for the application
import { Document } from 'mongoose';
import { Paginated } from './generic.types';

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
export interface MongoFilter<T = unknown> {
  [key: string]: unknown;
  $and?: MongoFilter<T>[];
  $or?: MongoFilter<T>[];
  $nor?: MongoFilter<T>[];
  $not?: MongoFilter<T>;
  $text?: {
    $search: string;
    $language?: string;
    $caseSensitive?: boolean;
    $diacriticSensitive?: boolean;
  };
}

export interface MongoUpdate<T = unknown> {
  $set?: Partial<T>;
  $unset?: Partial<Record<keyof T, 1 | '' | true>>;
  $inc?: Partial<Record<keyof T, number>>;
  $push?: Partial<Record<keyof T, unknown>>;
  $pull?: Partial<Record<keyof T, unknown>>;
  $addToSet?: Partial<Record<keyof T, unknown>>;
  $pop?: Partial<Record<keyof T, 1 | -1>>;
  $rename?: Partial<Record<keyof T, string>>;
  $currentDate?: Partial<Record<keyof T, Date | { $type: 'date' | 'timestamp' }>>;
  $min?: Partial<Record<keyof T, number>>;
  $max?: Partial<Record<keyof T, number>>;
  $mul?: Partial<Record<keyof T, number>>;
}

export interface MongoOptions {
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  projection?: Record<string, 0 | 1>;
  lean?: boolean;
  populate?: string | string[] | Record<string, unknown>;
  select?: string | string[];
  collation?: {
    locale: string;
    caseLevel?: boolean;
    caseFirst?: string;
    strength?: number;
    numericOrdering?: boolean;
    alternate?: string;
    maxVariable?: string;
    backwards?: boolean;
  };
}

// MongoDB Aggregation Types
export interface MongoAggregationStage {
  $match?: MongoFilter;
  $group?: Record<string, unknown>;
  $sort?: Record<string, 1 | -1>;
  $limit?: number;
  $skip?: number;
  $project?: Record<string, 0 | 1 | string | boolean>;
  $lookup?: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    pipeline?: MongoAggregationStage[];
  };
  $unwind?: string | { path: string; preserveNullAndEmptyArrays?: boolean };
  $facet?: Record<string, MongoAggregationStage[]>;
  $addFields?: Record<string, unknown>;
  $replaceRoot?: { newRoot: unknown };
  $count?: string;
  $sample?: { size: number };
  $geoNear?: {
    near: { type: 'Point'; coordinates: [number, number] };
    distanceField: string;
    spherical?: boolean;
    maxDistance?: number;
    minDistance?: number;
    query?: MongoFilter;
    includeLocs?: string;
    num?: number;
    uniqueDocs?: boolean;
  };
}

// MongoDB Result Types
export interface MongoResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  affectedRows?: number;
  insertedId?: string;
  modifiedCount?: number;
  deletedCount?: number;
  upsertedCount?: number;
  upsertedId?: string;
}

// MongoDB Pagination Types
export interface MongoPaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 0 | 1>;
}

// DEPRECATED: Use Paginated<T> from generic.types instead
export interface MongoPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Type alias for backward compatibility
export type MongoPaginated<T> = Paginated<T>;

// MongoDB Repository Interface
export interface IMongoRepository<T, CreateInput, UpdateInput, QueryInput> {
  create(input: CreateInput): Promise<T>;
  findById(id: string): Promise<T | null>;
  find(query: QueryInput): Promise<Paginated<T>>;
  findOne(query: QueryInput): Promise<T | null>;
  update(id: string, input: UpdateInput): Promise<T>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(query: QueryInput): Promise<number>;
  aggregate(pipeline: MongoAggregationStage[]): Promise<unknown[]>;
}

// MongoDB Connection Types
export interface MongoConnectionOptions {
  uri: string;
  database: string;
  options?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
    maxPoolSize?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    bufferMaxEntries?: number;
    bufferCommands?: boolean;
    autoIndex?: boolean;
    autoCreate?: boolean;
  };
}

export interface MongoConnectionStatus {
  connected: boolean;
  database: string;
  collections: string[];
  indexes: Record<string, string[]>;
  stats?: {
    collections: number;
    indexes: number;
    objects: number;
    dataSize: number;
    storageSize: number;
    indexSize: number;
  };
}

// MongoDB Index Types
export interface MongoIndex {
  name: string;
  key: Record<string, 1 | -1 | 'text' | '2dsphere' | '2d' | 'geoHaystack' | 'hashed'>;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: MongoFilter;
  collation?: {
    locale: string;
    caseLevel?: boolean;
    caseFirst?: string;
    strength?: number;
    numericOrdering?: boolean;
    alternate?: string;
    maxVariable?: string;
    backwards?: boolean;
  };
}

// MongoDB Change Stream Types
export interface MongoChangeStreamOptions {
  fullDocument?: 'default' | 'updateLookup' | 'whenAvailable' | 'required';
  resumeAfter?: unknown;
  startAtOperationTime?: Date;
  maxAwaitTimeMS?: number;
  batchSize?: number;
  collation?: {
    locale: string;
    caseLevel?: boolean;
    caseFirst?: string;
    strength?: number;
    numericOrdering?: boolean;
    alternate?: string;
    maxVariable?: string;
    backwards?: boolean;
  };
}

export interface MongoChangeStreamEvent<T = unknown> {
  _id: unknown;
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
  ns: {
    db: string;
    coll: string;
  };
  documentKey: { _id: unknown };
  updateDescription?: {
    updatedFields: Record<string, unknown>;
    removedFields: string[];
    truncatedArrays: Array<{ field: string; newSize: number }>;
  };
  clusterTime: unknown;
  txnNumber?: number;
  lsid?: unknown;
}
