FROM alpine:3.20

ARG PB_VERSION=0.27.0
RUN apk add --no-cache ca-certificates unzip wget \
  && wget -O /tmp/pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
  && unzip /tmp/pocketbase.zip -d /pb \
  && chmod +x /pb/pocketbase \
  && rm /tmp/pocketbase.zip

WORKDIR /pb
EXPOSE 8090
CMD ./pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" && ./pocketbase serve --http=0.0.0.0:${PORT:-8090}
