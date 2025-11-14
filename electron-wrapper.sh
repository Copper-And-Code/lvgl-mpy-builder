#!/bin/bash

# Electron wrapper script to set environment variables before startup
# This ensures Chromium/Electron use custom directories instead of /tmp

# Create custom tmp directory in user's home
CUSTOM_TMP="$HOME/.lvgl-editor-tmp"
mkdir -p "$CUSTOM_TMP"

# Set all temporary directory environment variables
export TMPDIR="$CUSTOM_TMP"
export TEMP="$CUSTOM_TMP"
export TMP="$CUSTOM_TMP"

# Set XDG directories to avoid /tmp
export XDG_RUNTIME_DIR="$CUSTOM_TMP/runtime"
export XDG_CACHE_HOME="$CUSTOM_TMP/cache"
mkdir -p "$XDG_RUNTIME_DIR" "$XDG_CACHE_HOME"

# Launch Electron with all arguments passed through
exec electron "$@"
