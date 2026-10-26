#!/usr/bin/env python3
"""Extract the public C symbols (functions, enum constants, macros, variables)
that an LVGL source tree declares *without* deprecated API aliases, plus the
functions marked LV_DEPRECATED (to be removed in the next major version).

When several trees are given, only the symbols declared by all of them are
kept. The C generator targets LVGL 9.6, so the fixture uses that tree only.

Usage:
    extract_c_symbols.py OUT.json LABEL=LVGL_ROOT [LABEL=LVGL_ROOT ...]

LVGL_ROOT is a checkout of the lvgl repository (the directory with lvgl.h).
"""

import json
import os
import re
import subprocess
import sys
import tempfile

# Alias headers (lv_api_map_*.h) of LVGL < 9.4 have no LV_DISABLE_API_MAPPING
# switch: pre-defining their include guards makes them empty.
API_MAP_GUARDS = [
    "LV_API_MAP_V8_H",
    "LV_API_MAP_V9_0_H",
    "LV_API_MAP_V9_1_H",
    "LV_API_MAP_V9_2_H",
    "LV_API_MAP_V9_3_H",
    "LV_API_MAP_V9_4_H",
    "LV_API_MAP_V9_5_H",
]

FONT_SIZES = range(8, 50, 2)

IDENT_RE = re.compile(r"\b(?:lv|LV)_[A-Za-z0-9_]+\b")


def compiler_flags(lvgl_root):
    include_dir = os.path.join(lvgl_root, "include", "lvgl")
    include = include_dir if os.path.isdir(include_dir) else lvgl_root
    flags = ["-std=c99", "-DLV_CONF_SKIP", "-DLV_DISABLE_API_MAPPING"]
    flags += ["-D%s" % guard for guard in API_MAP_GUARDS]
    flags += ["-DLV_FONT_MONTSERRAT_%d=1" % size for size in FONT_SIZES]
    flags += ["-I", include, "-I", lvgl_root]
    return flags


def run_cpp(lvgl_root, extra_args):
    with tempfile.NamedTemporaryFile("w", suffix=".c", delete=False) as source:
        source.write('#include "lvgl.h"\n')
        path = source.name
    try:
        cmd = ["gcc", "-E", *extra_args, *compiler_flags(lvgl_root), path]
        return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout
    finally:
        os.unlink(path)


def lvgl_version(lvgl_root):
    macros = run_cpp(lvgl_root, ["-dM"])
    parts = []
    for key in ("MAJOR", "MINOR", "PATCH"):
        match = re.search(r"#define LVGL_VERSION_%s (\d+)" % key, macros)
        parts.append(match.group(1) if match else "?")
    return ".".join(parts)


DEPRECATED_RE = re.compile(
    r"__attribute__\s*\(\(\s*(?:__)?deprecated(?:__)?\s*"  # __attribute__((deprecated
    r"(?:\(\s*(?:\"(?:[^\"\\\\]|\\\\.)*\"\s*)*\))?\s*\)\)"  # optional ("message")))
    r"[^;{(]*?\b(lv_[A-Za-z0-9_]+)\s*\(",  # return type, then the function name
    re.S,
)


def symbols(lvgl_root):
    """Returns (declared symbols, deprecated functions)."""
    preprocessed = run_cpp(lvgl_root, ["-P"])
    # Identifiers that survive preprocessing: functions, enum constants,
    # typedefs and variables (e.g. lv_font_montserrat_14)
    declared = set(IDENT_RE.findall(preprocessed))
    # Functions marked LV_DEPRECATED (removed in the next major version)
    deprecated = set(DEPRECATED_RE.findall(preprocessed))
    # Plus every public macro (LV_SIZE_CONTENT, LV_IMAGE_DECLARE, ...)
    for line in run_cpp(lvgl_root, ["-dM"]).splitlines():
        match = re.match(r"#define ((?:lv|LV)_[A-Za-z0-9_]+)", line)
        if match:
            declared.add(match.group(1))
    return declared, deprecated


def main(argv):
    if len(argv) < 3:
        print(__doc__, file=sys.stderr)
        return 2

    out_path, trees = argv[1], argv[2:]
    versions = {}
    common = None
    deprecated = set()
    for tree in trees:
        label, root = tree.split("=", 1)
        names, old = symbols(root)
        deprecated |= old
        versions[label] = {"version": lvgl_version(root), "count": len(names)}
        common = names if common is None else common & names
        print("%s: LVGL %s, %d symbols" % (label, versions[label]["version"], len(names)), file=sys.stderr)

    data = {
        "description": "LVGL C symbols declared, without API aliases, by every listed version",
        "generator": "scripts/lvgl-api/extract_c_symbols.py",
        "versions": versions,
        "symbols": sorted(common),
        "deprecated": sorted(deprecated),
    }
    with open(out_path, "w") as out:
        json.dump(data, out, indent=0)
        out.write("\n")
    print("common: %d symbols -> %s" % (len(common), out_path), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
