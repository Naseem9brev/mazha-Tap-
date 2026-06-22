FROM alpine:3.20

ARG POCKETBASE_VERSION=0.39.4

RUN apk add --no-cache ca-certificates unzip wget \
  && wget -O /tmp/pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip" \
  && unzip /tmp/pocketbase.zip -d /app \
  && chmod +x /app/pocketbase \
  && rm /tmp/pocketbase.zip

WORKDIR /app
COPY pb_migrations ./pb_migrations

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
