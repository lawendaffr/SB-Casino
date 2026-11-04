# Casino Project

## Requirements

- Git
- Docker Desktop

## Setup

### 1. Clone

git clone ...
cd SB-Casino
### 2. Create .env
copy .env.example
rename to .env
change values to your liking

### 3. Start app

docker compose up --build -d

### 4. View app

localhost:8080  

happi

## Frontend files

The editable frontend is in the repository-root `frontend/` directory. Docker Compose mounts it into the backend container, and Spring serves it at `http://localhost:8080`. Frontend file edits are picked up without rebuilding the image; rebuild after backend changes with `docker compose up --build -d`.

When running Spring Boot from IntelliJ, set the working directory to `kasynobackend`; Spring will resolve the default `../frontend/` location from there.
