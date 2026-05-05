FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir datasette

COPY datasette.yml /app/datasette.yml
COPY data/party_protocol.db /app/party_protocol.db
COPY data/party_bid.db /app/party_bid.db

RUN for db in /app/party_protocol.db /app/party_bid.db; do \
      header=$(head -c 15 "$db"); \
      if [ "$header" != "SQLite format 3" ]; then \
        echo "ERROR: $db is not a SQLite database (likely a Git LFS pointer)."; \
        echo "Run 'git lfs pull' in apps/db_api before deploying."; \
        exit 1; \
      fi; \
    done

EXPOSE 8080

CMD ["datasette", "serve", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--cors", \
     "-m", "/app/datasette.yml", \
     "-i", "/app/party_protocol.db", \
     "-i", "/app/party_bid.db", \
     "--setting", "num_sql_threads", "8", \
     "--setting", "default_cache_ttl", "3600", \
     "--setting", "sql_time_limit_ms", "5000"]
