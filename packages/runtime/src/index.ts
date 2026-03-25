export type DomainError = {
  code: string;
  message: string;
  details?: any;
};

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError };

export interface ApiResponse<T> {
  data: T;
  meta?: any;
}

export interface ApiErrorDTO {
  code: string;
  message: string;
  details?: any;
}

export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  signal?: AbortSignal;
}

export function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success === true;
}

export function isError<T>(result: Result<T>): result is { success: false; error: DomainError } {
  return result.success === false;
}
