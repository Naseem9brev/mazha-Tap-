FROM alpine:3.20

ARG PB_VERSION=0.23.12

RUN apk add --no-cache ca-certificates unzip wget \
  && wget -O /tmp/pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
  && unzip /tmp/pocketbase.zip -d /pb \
  && rm /tmp/pocketbase.zip

WORKDIR /pb
EXPOSE 8080

CMD ["sh", "-c", "./pocketbase serve --http=0.0.0.0:${PORT:-8080} --dir=/pb_data --publicDir=/pb_public"]
