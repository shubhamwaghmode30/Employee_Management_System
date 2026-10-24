/** Breadcrumb labels for a route, e.g. /employees/abc/edit -> Employees / Edit employee. */
export function getPageTrail(pathname: string): readonly string[] {
  const segments = pathname.split('/').filter((segment) => segment !== '');
  const [section, second, third] = segments;

  if (section === 'employees') {
    if (second === undefined) {
      return ['Employees'];
    }
    if (second === 'new') {
      return ['Employees', 'Add employee'];
    }
    if (second === 'deleted') {
      return ['Employees', 'Deleted employees'];
    }
    return third === 'edit' ? ['Employees', 'Edit employee'] : ['Employees', 'Employee details'];
  }
  if (section === 'profile') {
    return ['My profile'];
  }
  return ['Dashboard'];
}
