#!/usr/bin/env bash
# Build the Zotero Tag Sort .xpi package.
# Output: zotero-tag-sort.xpi
set -euo pipefail

cd "$(dirname "$0")"

OUT="zotero-tag-sort.xpi"

# Remove stale output
rm -f "$OUT"

# Package the contents of addon/ (manifest.json must be at the zip root).
# Skip all hidden files (macOS .DS_Store, .Rhistory, etc.).
(
  cd addon
  zip -r -X "../$OUT" . -x ".*" "*/.*" "*.DS_Store"
)

echo "Built $OUT"
echo "Contents:"
unzip -l "$OUT"
