#!/usr/bin/env python3
"""Extract the Python API surface of the LVGL MicroPython binding.

Input is what lv_binding_micropython's gen/gen_mpy.py produces for an LVGL
tree: the metadata JSON (-MD) and the generated C module (stdout), which is
needed for the methods of structs such as lv.anim_t and lv.style_t.

Usage:
    extract_micropython_api.py METADATA.json GENERATED_MODULE.c OUT.json \
        [--lvgl-version 9.3.0] [--binding-commit SHA]

See scripts/lvgl-api/README.md for the full regeneration procedure.
"""

import argparse
import json
import re
import sys


def enum_members(member):
    return sorted(member.get("members", {}).keys())


def split_members(members):
    methods = sorted(name for name, info in members.items() if info.get("type") == "function")
    enums = {
        name: enum_members(info)
        for name, info in sorted(members.items())
        if info.get("type") == "enum_type"
    }
    return methods, enums


def struct_methods(module_source, struct_names):
    result = {}
    for name in struct_names:
        match = re.search(
            r"mp_lv_%s_locals_dict_table\[\] = \{(.*?)\n\};" % re.escape(name),
            module_source,
            re.S,
        )
        if not match:
            continue
        qstrs = re.findall(r"MP_QSTR_([A-Za-z0-9_]+)", match.group(1))
        methods = sorted({q for q in qstrs if not q.startswith("__")})
        if methods:
            result[name] = methods
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("metadata")
    parser.add_argument("module_source")
    parser.add_argument("out")
    parser.add_argument("--lvgl-version", default="unknown")
    parser.add_argument("--binding-commit", default="unknown")
    args = parser.parse_args()

    with open(args.metadata) as f:
        meta = json.load(f)
    with open(args.module_source) as f:
        module_source = f.read()

    obj_methods, obj_enums = split_members(meta["objects"]["obj"]["members"])
    classes = {"obj": {"methods": obj_methods, "enums": obj_enums}}
    for name, info in sorted(meta["objects"].items()):
        if name == "obj":
            continue
        methods, enums = split_members(info["members"])
        # Store only what a class adds to lv.obj (members are inherited)
        classes[name] = {
            "methods": [m for m in methods if m not in obj_methods],
            "enums": {k: v for k, v in enums.items() if obj_enums.get(k) != v},
        }

    module_enums = {name: enum_members(info) for name, info in sorted(meta["enums"].items())}
    blobs = meta["blobs"]
    blob_names = sorted(blobs.keys() if isinstance(blobs, dict) else blobs)

    data = {
        "description": "Python API exposed by the LVGL MicroPython binding",
        "generator": "scripts/lvgl-api/extract_micropython_api.py",
        "lvgl_version": args.lvgl_version,
        "binding_commit": args.binding_commit,
        "module": {
            "functions": sorted(meta["functions"].keys()),
            "enums": module_enums,
            "int_constants": sorted(meta["int_constants"]),
            "blobs": blob_names,
        },
        "classes": classes,
        "structs": struct_methods(module_source, meta["structs"]),
    }

    with open(args.out, "w") as out:
        json.dump(data, out, indent=1, sort_keys=True)
        out.write("\n")
    print(
        "%d classes, %d module functions, %d enums, %d structs -> %s"
        % (len(classes), len(data["module"]["functions"]), len(module_enums), len(data["structs"]), args.out),
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
