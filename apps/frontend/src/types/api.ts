/** Shared API contract types — mirror backend `common/dto` + `AllExceptionsFilter`. */

/** Backend `PaginatedResult<T>` (list endpoints). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Error envelope from backend `AllExceptionsFilter`. */
export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string | string[];
  details?: unknown;
  path?: string;
}
