# Justfile

# Default task: Lists all available commands in the Justfile when run without arguments.
default:
    @just --list

# Task to build the Strapi project: Installs dependencies and builds the project.
build-strapi:
    cd strapi && npm install && npm run build

# Task to bring up Docker services in the background, building images if necessary.
compose-up:
    docker compose --env-file .env.example up -d --build

# Task to build the Strapi project and then start the Docker environment sequentially.
start: build-strapi compose-up
