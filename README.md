# Casino Project

## Requirements

- Git
- JDK 21
- Node.js
- Docker Desktop

## Setup

### 1. Clone

git clone ...
cd SB-Casino

### 2. Start PostgreSQL

docker compose up -d

### 3. Start backend

cd kasynobackend
./mvnw spring-boot:run

Windows:
.\mvnw.cmd spring-boot:run

### 4. Start frontend

cd frontend
npm install
npm run dev