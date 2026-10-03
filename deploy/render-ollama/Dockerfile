# Gemma (via Ollama) for the Patternwise AI Coach, on a Render web service.
# Ollama listens only on localhost; Caddy is the public entry point and rejects
# any request without "Authorization: Bearer $COACH_API_KEY". Render terminates HTTPS.

FROM caddy:2-alpine AS caddy

FROM ollama/ollama:latest
COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV OLLAMA_HOST=127.0.0.1:11434 \
    OLLAMA_KEEP_ALIVE=24h \
    OLLAMA_FLASH_ATTENTION=1 \
    OLLAMA_KV_CACHE_TYPE=q8_0 \
    OLLAMA_NUM_PARALLEL=1 \
    PULL_MODELS="gemma4:e2b-it-qat embeddinggemma"

ENTRYPOINT ["/start.sh"]
