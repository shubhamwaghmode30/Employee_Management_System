/** Mirrors backend Permission in app/domain/primitives.py. */
export type Permission =
  | 'EMPLOYEE_READ'
  | 'EMPLOYEE_CREATE'
  | 'EMPLOYEE_UPDATE'
  | 'EMPLOYEE_DELETE'
  | 'ROLE_ASSIGN';
