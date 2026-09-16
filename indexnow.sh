#!/bin/sh

# Submit new, changed, and deleted pages to IndexNow (Bing, Yandex, Naver,
# Seznam). Hashes every built HTML page and compares against the manifest
# from the previous run; only the difference is submitted. The manifest is
# only rewritten after a successful submission, so failures retry next run.
#
# Usage: indexnow.sh [-n|--dry-run]

set -u
export LC_ALL=C

cd "$(dirname "$0")" || exit 1

HOST="camille.sh"
KEY="7670efe84523156512d407f556040cc6"
ENDPOINT="https://api.indexnow.org/indexnow"
MANIFEST=".indexnow-manifest"

DRY=0
while [ $# -gt 0 ]; do
    case "$1" in
        -n|--dry-run)
            DRY=1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-n|--dry-run]"
            exit 1
            ;;
    esac
done

if [ ! -d public ]; then
    echo "indexnow: public/ not found, run hugo first" >&2
    exit 1
fi

# BSD md5 on macOS/FreeBSD, md5sum on Linux
if command -v md5 >/dev/null 2>&1; then
    hash_file() { md5 -q "$1"; }
else
    hash_file() { md5sum "$1" | cut -d' ' -f1; }
fi

tmp=$(mktemp -d) || exit 1
trap 'rm -rf "$tmp"' EXIT

find public -name index.html | sort | while read -r f; do
    printf '%s %s\n' "$f" "$(hash_file "$f")"
done > "$tmp/new"

if [ -f "$MANIFEST" ]; then
    sort "$MANIFEST" > "$tmp/old"
else
    : > "$tmp/old"
fi

# Lines only in the new manifest are new or changed pages; paths only in
# the old manifest are deleted pages (IndexNow accepts those too).
comm -13 "$tmp/old" "$tmp/new" | cut -d' ' -f1 > "$tmp/paths"
cut -d' ' -f1 "$tmp/old" > "$tmp/oldpaths"
cut -d' ' -f1 "$tmp/new" > "$tmp/newpaths"
comm -23 "$tmp/oldpaths" "$tmp/newpaths" >> "$tmp/paths"

if [ ! -s "$tmp/paths" ]; then
    echo "indexnow: no changes"
    exit 0
fi

sed -e "s|^public|https://$HOST|" -e 's|index\.html$||' "$tmp/paths" > "$tmp/urls"
count=$(wc -l < "$tmp/urls" | tr -d ' ')

urls=$(sed -e 's|.*|    "&",|' "$tmp/urls")
payload=$(printf '{\n  "host": "%s",\n  "key": "%s",\n  "keyLocation": "https://%s/%s.txt",\n  "urlList": [\n%s\n  ]\n}' \
    "$HOST" "$KEY" "$HOST" "$KEY" "${urls%,}")

if [ "$DRY" -eq 1 ]; then
    echo "indexnow: dry run, would submit $count URLs:"
    echo "$payload"
    exit 0
fi

status=$(curl -s -o "$tmp/response" -w '%{http_code}' \
    -X POST "$ENDPOINT" \
    -H 'Content-Type: application/json; charset=utf-8' \
    --data-binary "$payload")

case "$status" in
    200|202)
        cp "$tmp/new" "$MANIFEST"
        echo "indexnow: submitted $count URLs (HTTP $status)"
        ;;
    *)
        echo "indexnow: submission failed (HTTP $status)" >&2
        cat "$tmp/response" >&2
        echo >&2
        exit 1
        ;;
esac
