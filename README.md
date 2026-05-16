# 🚀 AnonConnect — Anonymous Random Video Chat Platform

> A modern, production-grade anonymous random video chat platform inspired by Azar, Omegle, and Chatroulette. Built with **Angular 19**, **Spring Boot 3**, **WebRTC**, **Socket.IO**, **PostgreSQL**, **Redis**, and deployed via **Docker + Kubernetes**.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [API Documentation](#api-documentation)
- [WebSocket Events](#websocket-events)
- [WebRTC Flow](#webrtc-flow)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Security](#security)

---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        NGINX Reverse Proxy                        │
│                     (SSL / Load Balancing)                         │
├─────────────────────┬────────────────────────────────────────────┤
│                     │                                            │
│   ┌─────────────┐   │   ┌───────────────────────────────────┐    │
│   │   Angular    │   │   │       Spring Boot Backend         │    │
│   │  Frontend    │◄──┼──►│  REST API + Socket.IO Signaling   │    │
│   │  (Port 80)   │   │   │       (Port 8080 + 9092)          │    │
│   └─────────────┘   │   └──────────┬───────────┬────────────┘    │
│                     │              │           │                  │
│                     │   ┌──────────▼──┐ ┌─────▼──────┐          │
│                     │   │ PostgreSQL  │ │   Redis     │          │
│                     │   │  (Port 5432)│ │ (Port 6379) │          │
│                     │   └─────────────┘ └────────────┘          │
│                     │                                            │
│   ┌─────────────────▼────────────────────────────────────────┐   │
│   │              WebRTC Peer-to-Peer Connection               │   │
│   │         (STUN/TURN via Coturn, Port 3478/5349)            │   │
│   └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer         | Technology                                        |
|---------------|---------------------------------------------------|
| Frontend      | Angular 19, Tailwind CSS, Socket.IO Client, WebRTC |
| Backend       | Spring Boot 3, Java 21, netty-socketio, JPA       |
| Database      | PostgreSQL 16                                     |
| Cache/Queue   | Redis 7                                           |
| Auth          | JWT (jjwt)                                        |
| Video         | WebRTC (P2P) + STUN/TURN (Coturn)                 |
| Proxy         | NGINX                                             |
| DevOps        | Docker, Kubernetes, Jenkins                       |

---

## ✨ Features

- **Anonymous Video Chat** — One-click random video matching
- **"Next" Button** — Instantly skip to next stranger
- **Real-time Text Chat** — Live messaging alongside video
- **WebRTC Video/Audio** — P2P HD video & audio
- **Gender & Country Filters** — Match preferences
- **Report & Block** — User safety controls
- **Admin Dashboard** — Real-time analytics & moderation
- **Dark/Light Theme** — Toggle with persistence
- **Online User Count** — Live counter
- **Typing Indicators** — See when peer is typing
- **Auto Reconnect** — Socket.IO reconnection
- **Mute/Camera/Screen Share** — Full media controls
- **JWT Authentication** — Secure sessions
- **Mobile Responsive** — Works on all devices
- **Glassmorphism UI** — Premium neon design

---

## 📁 Project Structure

```
anonconnect/
├── frontend/                     # Angular 19 Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/             # Services, guards, interceptors
│   │   │   │   ├── services/     # auth, socket, webrtc, theme
│   │   │   │   ├── guards/       # auth guard
│   │   │   │   └── interceptors/ # JWT interceptor
│   │   │   ├── features/         # Feature modules (lazy loaded)
│   │   │   │   ├── home/         # Landing page
│   │   │   │   ├── chat-room/    # Main chat room + search overlay
│   │   │   │   └── admin/        # Admin dashboard
│   │   │   ├── shared/           # Shared components
│   │   │   │   └── components/   # header, etc.
│   │   │   ├── app.component.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── environments/
│   │   ├── styles.scss
│   │   └── index.html
│   ├── tailwind.config.js
│   ├── angular.json
│   ├── Dockerfile
│   └── package.json
│
├── backend/                      # Spring Boot 3 Application
│   ├── src/main/java/com/anonconnect/
│   │   ├── config/               # Security, Redis, SocketIO, Web configs
│   │   ├── controller/           # REST controllers (Auth, User, Admin, Health)
│   │   ├── dto/                  # Data Transfer Objects
│   │   ├── entity/               # JPA Entities (User, ChatSession, Report, etc.)
│   │   ├── exception/            # Global exception handling
│   │   ├── repository/           # Spring Data JPA repositories
│   │   ├── security/             # JWT token provider & filter
│   │   ├── service/              # Business logic services
│   │   ├── signaling/            # Socket.IO signaling handler
│   │   └── AnonConnectApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/init.sql
│   ├── Dockerfile
│   └── pom.xml
│
├── k8s/                          # Kubernetes Manifests
│   ├── namespace.yml
│   ├── config.yml
│   ├── backend.yml
│   ├── frontend.yml
│   ├── database.yml
│   ├── ingress.yml
│   └── hpa.yml
│
├── nginx/                        # NGINX Configuration
│   └── nginx.conf
│
├── docker/                       # Docker Support Files
│   └── turnserver.conf
│
├── jenkins/                      # CI/CD Pipeline
│   └── Jenkinsfile
│
├── docker-compose.yml            # Full Stack Docker Compose
├── .env.example                  # Environment variables template
└── .gitignore
```

---

## 📦 Prerequisites

- **Java 21** (for backend)
- **Node.js 20+** (for frontend)
- **Docker & Docker Compose** (for containerized deployment)
- **PostgreSQL 16** (or use Docker)
- **Redis 7** (or use Docker)

---

## ⚡ Quick Start (Docker Compose)

The fastest way to run the entire stack:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd anonconnect

# 2. Create environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Open the application
# Frontend: http://localhost:4200
# Backend API: http://localhost:8080/api/health
# Full stack via NGINX: http://localhost
```

---

## 🔧 Development Setup

### Backend (Spring Boot)

```bash
cd backend

# Install Maven wrapper (if not present)
mvn -N wrapper:wrapper

# Run with dev profile
./mvnw spring-boot:run

# Backend will start on http://localhost:8080
# Socket.IO signaling on ws://localhost:9092
```

> **Note:** Ensure PostgreSQL and Redis are running locally, or start them via:
> ```bash
> docker-compose up -d postgres redis
> ```

### Frontend (Angular)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start

# Frontend will start on http://localhost:4200
```

---

## 📡 API Documentation

### Authentication

| Method | Endpoint              | Description              | Auth |
|--------|-----------------------|--------------------------|------|
| POST   | `/api/auth/register`  | Register new user        | No   |
| POST   | `/api/auth/login`     | Login existing user      | No   |
| POST   | `/api/auth/anonymous` | Create anonymous session | No   |

### Users

| Method | Endpoint                   | Description          | Auth |
|--------|----------------------------|----------------------|------|
| GET    | `/api/users/count`         | Get online count     | No   |
| POST   | `/api/users/report`        | Report a user        | Yes  |
| POST   | `/api/users/block/{id}`    | Block a user         | Yes  |
| DELETE | `/api/users/block/{id}`    | Unblock a user       | Yes  |

### Admin (Role: ADMIN)

| Method | Endpoint                             | Description           |
|--------|--------------------------------------|-----------------------|
| GET    | `/api/admin/dashboard`               | Dashboard statistics  |
| GET    | `/api/admin/users`                   | List all users        |
| GET    | `/api/admin/reports`                 | List pending reports  |
| POST   | `/api/admin/reports/{id}/resolve`    | Resolve a report      |
| POST   | `/api/admin/ban/{userId}`            | Ban a user            |
| POST   | `/api/admin/unban/{userId}`          | Unban a user          |

### Health

| Method | Endpoint       | Description    |
|--------|----------------|----------------|
| GET    | `/api/health`  | Health check   |

---

## 🔌 WebSocket Events

### Client → Server

| Event           | Payload                                    | Description           |
|-----------------|--------------------------------------------|-----------------------|
| `join-queue`    | `{ preferredGender?, preferredCountry? }`  | Join matchmaking      |
| `leave-queue`   | -                                          | Leave queue           |
| `next`          | -                                          | Skip to next user     |
| `end-session`   | -                                          | End current session   |
| `chat-message`  | `{ content }`                              | Send text message     |
| `typing`        | -                                          | Typing indicator      |
| `stop-typing`   | -                                          | Stop typing           |
| `offer`         | `{ targetSocketId, sdp }`                  | WebRTC offer          |
| `answer`        | `{ targetSocketId, sdp }`                  | WebRTC answer         |
| `ice-candidate` | `{ targetSocketId, candidate }`            | ICE candidate         |

### Server → Client

| Event               | Payload                                           | Description             |
|---------------------|---------------------------------------------------|-------------------------|
| `match-found`       | `{ sessionId, peerId, peerSocketId, initiator }`  | Match assigned          |
| `peer-disconnected` | -                                                 | Peer left               |
| `chat-message`      | `{ content, senderId, timestamp }`                | Incoming message        |
| `typing`            | `{ userId }`                                      | Peer is typing          |
| `stop-typing`       | `{ userId }`                                      | Peer stopped typing     |
| `online-count`      | `{ count }`                                       | Live online count       |
| `offer`             | `{ sdp, fromSocketId }`                           | Incoming WebRTC offer   |
| `answer`            | `{ sdp, fromSocketId }`                           | Incoming WebRTC answer  |
| `ice-candidate`     | `{ candidate, fromSocketId }`                     | Incoming ICE candidate  |

---

## 🎥 WebRTC Flow

```
User A                    Signaling Server                    User B
  │                            │                                │
  │──── join-queue ───────────►│                                │
  │                            │◄──────── join-queue ───────────│
  │                            │                                │
  │◄── match-found ───────────│──── match-found ───────────────►│
  │    (initiator: true)       │    (initiator: false)          │
  │                            │                                │
  │── createOffer() ──────────►│                                │
  │── offer (SDP) ────────────►│──── offer (SDP) ──────────────►│
  │                            │                                │
  │                            │◄── answer (SDP) ───────────────│
  │◄── answer (SDP) ──────────│                                │
  │                            │                                │
  │── ice-candidate ──────────►│──── ice-candidate ────────────►│
  │◄── ice-candidate ─────────│◄── ice-candidate ──────────────│
  │                            │                                │
  │◄═══════════════ P2P Video/Audio Connected ═════════════════►│
```

---

## 🗄 Database Schema

| Table               | Key Fields                                            |
|---------------------|-------------------------------------------------------|
| `users`             | id, username, password_hash, country, gender, role, is_banned |
| `user_preferences`  | user_id, preferred_gender, preferred_country, theme   |
| `chat_sessions`     | caller_id, receiver_id, status, start_time, end_time  |
| `chat_messages`     | session_id, sender_id, content, message_type          |
| `reports`           | reporter_id, reported_id, reason, status              |
| `blocked_users`     | blocker_id, blocked_id                                |
| `active_connections`| user_id, socket_id, ip_address                        |

---

## 🚢 Deployment

### Docker Compose (Development/Staging)

```bash
docker-compose up -d
```

### Kubernetes (Production)

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/config.yml
kubectl apply -f k8s/database.yml
kubectl apply -f k8s/backend.yml
kubectl apply -f k8s/frontend.yml
kubectl apply -f k8s/ingress.yml
kubectl apply -f k8s/hpa.yml

# Verify
kubectl get pods -n anonconnect
```

### CI/CD (Jenkins)

The `jenkins/Jenkinsfile` provides a full pipeline:
1. Checkout → 2. Backend Build & Test → 3. Frontend Build → 4. Docker Build → 5. Push → 6. K8s Deploy

---

## 🔐 Security

- **JWT Authentication** with bcrypt password hashing
- **Role-based access** (USER / ADMIN)
- **Rate limiting** via NGINX (30r/s API, 5r/s auth)
- **CORS** configured for frontend origin
- **Security headers** (X-Frame-Options, CSP, etc.)
- **SSL/TLS** support via NGINX
- **Input validation** on all endpoints
- **SQL injection prevention** via JPA parameterized queries
- **XSS prevention** via Angular's built-in sanitization

---

## 📄 License

This project is for educational and portfolio purposes.
