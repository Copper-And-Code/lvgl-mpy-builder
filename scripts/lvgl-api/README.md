# LVGL API reference data

The code generators only emit LVGL calls that exist in their target, and the
test suite checks every generated name against two JSON files in
`tests/fixtures/`:

| File | Content | Source |
|---|---|---|
| `lvgl-c-symbols.json` | C functions, enum constants, macros and variables of **LVGL 9.6** without the deprecated aliases (`lv_api_map_*.h`), plus the functions marked `LV_DEPRECATED` (removed in LVGL 10) | LVGL 9.6 headers |
| `lvgl-micropython-api.json` | Classes, methods, enums, struct methods and module functions of the `lvgl` module of the **lv_micropython** firmware (MicroPython 1.24.1, LVGL 9.3.0) | metadata written by the firmware build |

The two targets differ: the C code targets LVGL 9.6 and avoids everything
deprecated, while the official MicroPython firmware (`lvgl/lv_micropython`)
still ships LVGL 9.3. The MicroPython fixture must come from a real firmware
build: the binding only preprocesses `lvgl_private.h`, so for example
`lv.spinner` and `lv.list` are **not** available although the LVGL
configuration enables them.

## Regenerating

Requirements: `git`, `gcc`, `make`, `pkg-config`, `libffi-dev`, Python 3.

```sh
WORK=$(mktemp -d)
LV_MICROPYTHON_COMMIT=44aa2b153dd3aa1ba183d05bd867fe3ffe2a1d75   # keep in sync with .github/workflows/ci.yml

# 1. C symbols of LVGL 9.6
git clone --depth 1 --branch v9.6.0 https://github.com/lvgl/lvgl.git "$WORK/lvgl-9.6"
python3 scripts/lvgl-api/extract_c_symbols.py tests/fixtures/lvgl-c-symbols.json lvgl-9.6="$WORK/lvgl-9.6"

# 2. MicroPython API: build the lv_micropython unix firmware, then read the
#    metadata (lv_mpy.json) and module source (lv_mpy.c) of its LVGL binding
src="$WORK/lv_micropython"
git init -q "$src"
git -C "$src" fetch -q --depth 1 https://github.com/lvgl/lv_micropython.git "$LV_MICROPYTHON_COMMIT"
git -C "$src" checkout -q FETCH_HEAD
git -C "$src" submodule update --init --depth 1 \
  user_modules/lv_binding_micropython lib/micropython-lib lib/berkeley-db-1.xx lib/mbedtls
git -C "$src/user_modules/lv_binding_micropython" submodule update --init --depth 1 lvgl pycparser
make -C "$src/mpy-cross" -j && make -C "$src/ports/unix" VARIANT=lvgl -j

python3 scripts/lvgl-api/extract_micropython_api.py \
  "$src/ports/unix/build-lvgl/lvgl/lv_mpy.json" "$src/ports/unix/build-lvgl/lvgl/lv_mpy.c" \
  tests/fixtures/lvgl-micropython-api.json --lvgl-version 9.3.0 \
  --binding-commit "$(git -C "$src/user_modules/lv_binding_micropython" rev-parse HEAD)"
```

When lv_micropython moves to a newer LVGL, update `LV_MICROPYTHON_COMMIT`,
regenerate the MicroPython fixture and run `npm test`: the tests list every
generated name that no longer exists.

## Compiling and running the generated code

`tests/toolchain.test.js` compiles the generated C of the test projects with
`gcc -fsyntax-only -DLV_DISABLE_API_MAPPING -Werror=deprecated-declarations`
against the LVGL 9.6 headers, and runs the generated MicroPython on the
lv_micropython unix firmware with a headless display (all pages, animations
and events, with `gc.collect()` on every tick). It is skipped unless the paths
are set; CI always sets them:

```sh
LVGL_96_DIR="$WORK/lvgl-9.6" \
MICROPYTHON_LVGL="$src/ports/unix/build-lvgl/micropython" \
npx vitest run tests/toolchain.test.js
```
