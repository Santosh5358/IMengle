# Project Overview: RandomVideo (Azar/Omegle Clone)

## 1. Project Architecture
- **Frontend**: Angular 19 (Standalone Components, Signals, RxJS)
- **Backend**: Spring Boot 3 (Java 21)
- **Real-time**: Socket.IO (for signaling and chat)
- **Video**: WebRTC (Peer-to-Peer with STUN/TURN)
- **Database**: PostgreSQL (Persistence)
- **Caching/Queue**: Redis (Matchmaking queue, session storage)
- **Infrastructure**: Docker, Kubernetes, NGINX

## 2. Screen List (UI/UX)
1. **Landing Page**: Animated hero section, "Start Chatting" button, online user count.
2. **Random Chat Room**: Dual video panels (Local/Remote), side-mounted chat bar, "Next" button, Report/Block controls.
3. **Matchmaking Overlay**: Glassmorphism search animation while waiting for a peer.
4. **Admin Dashboard**: Real-time analytics, user report management, ban/unban interface.

## 3. Database Schema
- `users`: id, username, country, gender, last_active, is_banned.
- `chat_sessions`: id, caller_id, receiver_id, start_time, end_time.
- `reports`: id, reporter_id, reported_id, reason, status.
- `user_preferences`: user_id, preferred_gender, preferred_country.

## 4. API Endpoints (Spring Boot)
- `POST /api/auth/register`: Anonymous session creation.
- `GET /api/users/count`: Total online users.
- `GET /api/admin/reports`: List pending reports.
- `POST /api/admin/ban/{userId}`: Ban a user.

## 5. WebSocket / Signaling Flow
1. User connects to Socket.IO.
2. User emits `join-queue` with preferences.
3. Redis backend matches two users.
4. Signaling server emits `match-found` to both with peer IDs.
5. Clients exchange SDP Offers/Answers and ICE Candidates via Socket.IO.
6. P2P WebRTC connection established.

## 6. Folder Structure
```text
/randomvideo-root
  /frontend (Angular)
    /src/app/core (services, guards)
    /src/app/features/chat (components, store)
    /src/app/shared (glassmorphism UI components)
  /backend (Spring Boot)
    /src/main/java/com/randomvideo/matchmaking (Redis logic)
    /src/main/java/com/randomvideo/signaling (WebSocket)
  /k8s (K8s manifests)
  /docker (Dockerfiles, compose)
  /jenkins (Pipeline)
```