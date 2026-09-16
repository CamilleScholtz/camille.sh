#!/bin/sh

# Parse command line arguments
PULL=0
INDEXNOW=1
while [ $# -gt 0 ]; do
    case "$1" in
        -p|--pull)
            PULL=1
            shift
            ;;
        -n|--no-indexnow)
            INDEXNOW=0
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-p|--pull] [-n|--no-indexnow]"
            exit 1
            ;;
    esac
done

# Pull latest changes if requested
if [ "$PULL" -eq 1 ]; then
    git pull
fi

# Set up trap to clean up build directory on interrupt
trap 'rm -rf "/www/camille.sh/build"' INT TERM

# Build Hugo site
hugo -s "/www/camille.sh" --minify --cleanDestinationDir -d "/www/camille.sh/build"

# Atomically replace public directory
if [ -d "/www/camille.sh/public" ]; then
    rm -rf "/www/camille.sh/public"
fi
mv "/www/camille.sh/build" "/www/camille.sh/public"

# Submit changed pages to IndexNow
if [ "$INDEXNOW" -eq 1 ]; then
    ./indexnow.sh || true
fi
