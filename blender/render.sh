#!/usr/bin/env bash
# Render do tigre (requer Blender 3.6+ instalado — ex. Mac com Xcode).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p renders
if ! command -v blender >/dev/null 2>&1; then
  echo "Blender não encontrado. Instale em https://www.blender.org/download/"
  echo "No Mac: brew install --cask blender"
  exit 1
fi
blender --background --python blender/tigre.py -- --out renders
ls -la renders/
