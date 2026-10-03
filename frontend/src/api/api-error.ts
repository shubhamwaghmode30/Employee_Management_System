export type HttpErrorKind =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'server';

export type ApiError =
  | { kind: HttpErrorKind; status: number; code: string | null; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'invalid_response'; message: string };

export function getHttpErrorKind(status: number): HttpErrorKind {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    default:
      return status >= 500 ? 'server' : 'bad_request';
  }
}
