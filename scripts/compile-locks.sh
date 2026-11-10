#!/usr/bin/env sh
# Regenerates requirements.lock and requirements-dev.lock from the *.txt inputs.
#
#   pip install uv==0.13.7   # same version as CI
#   sh scripts/compile-locks.sh
#
# --universal makes the result independent of the machine it runs on (markers
# instead of platform-specific pins), so Windows, macOS and Linux give the same
# files. Existing pins are kept unless an input changed; pass --upgrade to move
# everything to the newest versions.
#
# CI runs this script and fails if it changes either lock file, which catches a
# dependency added to requirements.txt without regenerating the lock.
set -eu

cd "$(dirname "$0")/.."

HINT="sh scripts/compile-locks.sh"

uv pip compile requirements.txt \
    --universal --python-version 3.14 \
    --custom-compile-command "$HINT" \
    --output-file requirements.lock "$@"

# Dev tools are resolved against the runtime pins, so installing them can never
# move a runtime dependency to a different version.
uv pip compile requirements-dev.txt \
    --universal --python-version 3.14 \
    --constraints requirements.lock \
    --custom-compile-command "$HINT" \
    --output-file requirements-dev.lock "$@"
