"""Scan codebase for forbidden type patterns and exit non-zero on matches.

This script enforces type-safety rules by checking for:
- Any (explicit type annotation)
- dict[str, Any] (loose dictionary with any values)
- Dict[str, Any] (loose dictionary with any values, typing module)
- # type: ignore (uncommented mypy suppression)

The script scans backend/app, backend/tests, and backend/scripts.
It excludes itself from the scan to avoid false positives.
"""

import argparse
import re
import sys
from pathlib import Path

FORBIDDEN_PATTERNS = [
    (r"\bAny\b", "Any type annotation"),
    (r"dict\[str,\s*Any\]", "dict[str, Any]"),
    (r"Dict\[str,\s*Any\]", "Dict[str, Any]"),
    (r"#\s*type:\s*ignore", "# type: ignore comment"),
]

DIRECTORIES_TO_SCAN = [
    "app",
    "tests",
    "scripts",
]


def scan_file(file_path: Path) -> list[tuple[int, str, str]]:
    """Scan a single file for forbidden patterns.

    Returns list of (line_number, pattern_name, matched_text).
    """
    matches: list[tuple[int, str, str]] = []

    try:
        content = file_path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return matches

    for line_number, line in enumerate(content.splitlines(), start=1):
        for pattern, description in FORBIDDEN_PATTERNS:
            if re.search(pattern, line):
                matches.append((line_number, description, line.strip()))
                break

    return matches


def main() -> None:
    parser = argparse.ArgumentParser(description="Check for forbidden type patterns")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).parent.parent,
        help="Root directory of backend project",
    )
    args = parser.parse_args()

    root = args.root
    self_path = Path(__file__).resolve()

    all_matches: list[tuple[Path, int, str, str]] = []

    for dir_name in DIRECTORIES_TO_SCAN:
        dir_path = root / dir_name
        if not dir_path.exists():
            continue

        for py_file in dir_path.rglob("*.py"):
            if py_file.resolve() == self_path:
                continue

            matches = scan_file(py_file)
            for line_number, pattern_name, matched_text in matches:
                all_matches.append((py_file, line_number, pattern_name, matched_text))

    if all_matches:
        print("Forbidden type patterns found:", file=sys.stderr)
        for file_path, line_number, pattern_name, matched_text in all_matches:
            relative_path = file_path.relative_to(root)
            print(f"  {relative_path}:{line_number}: {pattern_name}", file=sys.stderr)
            print(f"    {matched_text}", file=sys.stderr)
        sys.exit(1)

    print("No forbidden type patterns found.")
    sys.exit(0)


if __name__ == "__main__":
    main()
