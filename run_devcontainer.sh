#!/bin/bash

docker context use default
docker build -t opampdev -f Dockerfile.dev .

#mkdir -p $(pwd)/.next-container

docker run -it --rm \
    -v $(pwd):/app \
    -p 127.0.0.1:5173:5173 \
    --user 1000:1000 \
    --net devnet \
    --ip 10.0.0.3 \
    --network=postgres \
    -e DATABASE_URL=postgres://postgres@postgres-postgres-1:5432/opamp \
    --name opamp opampdev
