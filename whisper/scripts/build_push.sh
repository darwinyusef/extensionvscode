#!/bin/bash

REGISTRY=${DOCKER_REGISTRY:-"localhost:5000"}
VERSION=${VERSION:-"latest"}

echo "Building images..."

docker build -t ${REGISTRY}/whisper-grpc:${VERSION} ./grpc_service
docker build -t ${REGISTRY}/whisper-api:${VERSION} ./api_gateway

echo "Pushing images..."

docker push ${REGISTRY}/whisper-grpc:${VERSION}
docker push ${REGISTRY}/whisper-api:${VERSION}

echo "Done!"
echo "  gRPC: ${REGISTRY}/whisper-grpc:${VERSION}"
echo "  API: ${REGISTRY}/whisper-api:${VERSION}"
