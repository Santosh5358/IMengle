import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs';

export interface MatchFoundEvent {
  sessionId: string;
  peerId: string;
  peerSocketId: string;
  initiator: boolean;
}

export interface ChatMessageEvent {
  content: string;
  senderId: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  readonly isConnected = signal(false);
  readonly onlineCount = signal(0);

  // Event subjects
  readonly matchFound$ = new Subject<MatchFoundEvent>();
  readonly chatMessage$ = new Subject<ChatMessageEvent>();
  readonly peerDisconnected$ = new Subject<void>();
  readonly typing$ = new Subject<string>();
  readonly stopTyping$ = new Subject<string>();
  readonly searching$ = new Subject<void>();
  readonly queueJoined$ = new Subject<{ position: number }>();

  // WebRTC signaling subjects
  readonly offer$ = new Subject<{ sdp: RTCSessionDescriptionInit; fromSocketId: string }>();
  readonly answer$ = new Subject<{ sdp: RTCSessionDescriptionInit; fromSocketId: string }>();
  readonly iceCandidate$ = new Subject<{ candidate: RTCIceCandidateInit; fromSocketId: string }>();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    const user = this.authService.currentUser();
    if (!user) return;

    const socketUrl = environment.socketUrl?.trim() || undefined;

    this.socket = io(socketUrl, {
      path: '/socket.io',
      query: { userId: user.userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on('online-count', (data: { count: number }) => {
      this.onlineCount.set(data.count);
    });

    this.socket.on('match-found', (data: MatchFoundEvent) => {
      this.matchFound$.next(data);
    });

    this.socket.on('chat-message', (data: ChatMessageEvent) => {
      this.chatMessage$.next(data);
    });

    this.socket.on('peer-disconnected', () => {
      this.peerDisconnected$.next();
    });

    this.socket.on('typing', (data: { userId: string }) => {
      this.typing$.next(data.userId);
    });

    this.socket.on('stop-typing', (data: { userId: string }) => {
      this.stopTyping$.next(data.userId);
    });

    this.socket.on('searching', () => {
      this.searching$.next();
    });

    this.socket.on('queue-joined', (data: { position: number }) => {
      this.queueJoined$.next(data);
    });

    // WebRTC signaling
    this.socket.on('offer', (data: { sdp: RTCSessionDescriptionInit; fromSocketId: string }) => {
      this.offer$.next(data);
    });

    this.socket.on('answer', (data: { sdp: RTCSessionDescriptionInit; fromSocketId: string }) => {
      this.answer$.next(data);
    });

    this.socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit; fromSocketId: string }) => {
      this.iceCandidate$.next(data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected.set(false);
  }

  joinQueue(preferences?: { preferredGender?: string; preferredCountry?: string }): void {
    this.socket?.emit('join-queue', preferences || {});
  }

  leaveQueue(): void {
    this.socket?.emit('leave-queue');
  }

  sendChatMessage(content: string): void {
    this.socket?.emit('chat-message', { content });
  }

  sendTyping(): void {
    this.socket?.emit('typing', {});
  }

  sendStopTyping(): void {
    this.socket?.emit('stop-typing', {});
  }

  nextUser(): void {
    this.socket?.emit('next');
  }

  endSession(): void {
    this.socket?.emit('end-session');
  }

  // WebRTC signaling
  sendOffer(targetSocketId: string, sdp: RTCSessionDescriptionInit): void {
    this.socket?.emit('offer', { targetSocketId, sdp });
  }

  sendAnswer(targetSocketId: string, sdp: RTCSessionDescriptionInit): void {
    this.socket?.emit('answer', { targetSocketId, sdp });
  }

  sendIceCandidate(targetSocketId: string, candidate: RTCIceCandidateInit): void {
    this.socket?.emit('ice-candidate', { targetSocketId, candidate });
  }
}
