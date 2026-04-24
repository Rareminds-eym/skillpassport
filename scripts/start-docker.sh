#!/bin/bash

# Start Docker Desktop if not running
if ! docker info > /dev/null 2>&1; then
  echo "Starting Docker Desktop..."

  if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Docker
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>/dev/null || \
    start "" "$PROGRAMFILES\Docker\Docker\Docker Desktop.exe" 2>/dev/null
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null
  fi

  echo "Waiting for Docker to be ready..."
  until docker info > /dev/null 2>&1; do
    sleep 2
  done
  echo "Docker is ready."
else
  echo "Docker is already running."
fi
