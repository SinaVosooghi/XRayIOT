// Generic utility types for the XRayIOT project

// Unified Pagination Interface
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  cursor?: string;
}

// Common Document Patterns
export type Timestamped<T> = T & { createdAt: Date; updatedAt: Date };
export type WithId<T> = T & { _id: string };
export type Document<T> = WithId<Timestamped<T>>;

// API Response Patterns
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<Paginated<T>> {
  // Extends ApiResponse<Paginated<T>> with additional pagination metadata
  pagination: {
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Error Handling Patterns
export interface ErrorWithContext {
  message: string;
  code: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

// Generic Result Types
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface AsyncResult<T, E = Error> extends Promise<Result<T, E>> {
  // Extends Promise<Result<T, E>> with additional async operation metadata
  timeout?: number;
  retryCount?: number;
}

// Generic Filter Types
export interface BaseFilter {
  limit?: number;
  skip?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TimeRangeFilter extends BaseFilter {
  from?: Date | string;
  to?: Date | string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

// Generic Validation Types
export interface ValidationResult<T = unknown> {
  valid: boolean;
  input: T;
  errors: string[];
  warnings: string[];
  info: string[];
}

// Generic Processing Types
export interface ProcessingContext {
  id: string;
  timestamp: Date;
  retryCount: number;
  metadata?: Record<string, unknown>;
}

export interface ProcessingResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  context: ProcessingContext;
  processingTime: number;
}

// Generic Metrics Types
export interface BaseMetrics {
  totalProcessed: number;
  totalErrors: number;
  totalRetries: number;
  averageProcessingTime: number;
  lastProcessedAt: Date;
}

// Generic Configuration Types
export interface BaseConfig {
  enabled: boolean;
  timeout?: number;
  retries?: number;
  batchSize?: number;
}

// Generic Event Types
export interface BaseEvent<T = unknown> {
  type: string;
  timestamp: Date;
  data: T;
  metadata?: Record<string, unknown>;
}

// Generic Service Interface
export interface BaseService<T, CreateInput, UpdateInput, QueryInput> {
  create(input: CreateInput): Promise<T>;
  findById(id: string): Promise<T | null>;
  find(query: QueryInput): Promise<Paginated<T>>;
  update(id: string, input: UpdateInput): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Generic Repository Interface
export interface BaseRepository<T, CreateInput, UpdateInput, QueryInput> {
  create(input: CreateInput): Promise<T>;
  findById(id: string): Promise<T | null>;
  find(query: QueryInput): Promise<Paginated<T>>;
  update(id: string, input: UpdateInput): Promise<T>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

// Generic Factory Types
export interface BaseFactory<T, Config = unknown> {
  create(config?: Config): T;
  createMany(count: number, config?: Config): T[];
}

// Generic Adapter Types
export interface BaseAdapter<Input, Output> {
  adapt(input: Input): Output;
  adaptMany(inputs: Input[]): Output[];
}

// Generic Transformer Types
export interface BaseTransformer<Input, Output> {
  transform(input: Input): Output;
  transformMany(inputs: Input[]): Output[];
  canTransform(input: unknown): input is Input;
}

// Generic Validator Types
export interface BaseValidator<T> {
  validate(input: T): ValidationResult<T>;
  validateMany(inputs: T[]): ValidationResult<T>[];
  isValid(input: T): boolean;
}
