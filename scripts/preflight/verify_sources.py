#!/usr/bin/env python3
"""Verify downloaded source CAD against the provenance manifest."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "assets/source-manifest/sources.json"


def main() -> None:
    manifest = json.loads(MANIFEST.read_text())
    failures = []
    for record in manifest["files"]:
        path = ROOT / record["path"]
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        valid_step = data.startswith(b"ISO-10303-21;") and data.rstrip().endswith(
            b"END-ISO-10303-21;"
        )
        ok = len(data) == record["bytes"] and digest == record["sha256"] and valid_step
        print(
            f"{'PASS' if ok else 'FAIL'} {record['path']} "
            f"bytes={len(data)} sha256={digest} step_envelope={valid_step}"
        )
        if not ok:
            failures.append(record["path"])
    if failures:
        raise SystemExit(f"source verification failed: {', '.join(failures)}")


if __name__ == "__main__":
    main()
