#!/usr/bin/env sh

set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
COREPACK_HOME="$project_root/.corepack"
NEXT_TELEMETRY_DISABLED=1
PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$project_root/.playwright-browsers}"
export COREPACK_HOME
export NEXT_TELEMETRY_DISABLED
export PLAYWRIGHT_BROWSERS_PATH

exec corepack pnpm "$@"
