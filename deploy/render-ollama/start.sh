#!/bin/sh
set -e

if [ -z "$COACH_API_KEY" ] || [ ${#COACH_API_KEY} -lt 24 ]; then
  echo "COACH_API_KEY must be set (24+ characters)." >&2
  exit 1
fi

ollama serve &

until ollama list >/dev/null 2>&1; do sleep 1; done
echo "Ollama is up."

# Pull in the background so the port opens immediately (Render's deploy check).
# Models live on the persistent disk, so after the first deploy this is quick.
(
  for m in $PULL_MODELS; do
    echo "Pulling $m…"
    ollama pull "$m" >/dev/null && echo "Ready: $m"
  done
) &

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
