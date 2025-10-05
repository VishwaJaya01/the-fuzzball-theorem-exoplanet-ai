
"""
Copy trained artifacts to a deployment target (default: /data/model).
Keeps feature_names + metrics + latest.txt.

Usage:
  python -m model.export_model --artifacts /path/artifacts --target /data/model
"""
from __future__ import annotations
import argparse, shutil
from pathlib import Path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--artifacts", required=True, help="Folder containing trained artifacts")
    ap.add_argument("--target", default="/data/model", help="Deployment target folder")
    args = ap.parse_args()

    src = Path(args.artifacts)
    dst = Path(args.target)
    dst.mkdir(parents=True, exist_ok=True)

    # copy everything (small set of files)
    for p in src.glob("*"):
        if p.is_file():
            shutil.copy2(p, dst / p.name)

    print("Copied artifacts →", dst)

if __name__ == "__main__":
    main()
