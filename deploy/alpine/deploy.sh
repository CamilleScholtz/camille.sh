#!/bin/sh
# Alpine deploy for camille.sh (static Hugo site).
# Differs from deploy/freebsd/deploy.sh only in deriving the site directory
# from this script's location instead of hardcoding /www/camille.sh.

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
APP_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)
cd "$APP_DIR"

PULL=0
INDEXNOW=1
while [ $# -gt 0 ]; do
    case "$1" in
        -p|--pull) PULL=1; shift ;;
        -n|--no-indexnow) INDEXNOW=0; shift ;;
        *) echo "Unknown option: $1"; echo "Usage: $0 [-p|--pull] [-n|--no-indexnow]"; exit 1 ;;
    esac
done

[ "$PULL" -eq 1 ] && git pull

trap 'rm -rf "$APP_DIR/build"' INT TERM

hugo -s "$APP_DIR" --minify --cleanDestinationDir -d "$APP_DIR/build"

# Atomically replace the served directory.
if [ -d "$APP_DIR/public" ]; then
    rm -rf "$APP_DIR/public"
fi
mv "$APP_DIR/build" "$APP_DIR/public"

if [ "$INDEXNOW" -eq 1 ]; then
    ./indexnow.sh || true
fi
