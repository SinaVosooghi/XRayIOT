// Extend the Request interface to include our custom properties
export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  get(name: string): string | undefined;
  deviceId?: string;
  hmacValidated?: boolean;
  body?: unknown;
  query?: Record<string, unknown>;
  rawBody?: Buffer | string;
}
