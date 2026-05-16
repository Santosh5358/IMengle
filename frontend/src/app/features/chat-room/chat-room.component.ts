import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService, MatchFoundEvent, ChatMessageEvent } from '../../core/services/socket.service';
import { WebrtcService } from '../../core/services/webrtc.service';
import { AuthService } from '../../core/services/auth.service';
import { SearchOverlayComponent } from './search-overlay/search-overlay.component';

interface ChatMsg {
  content: string;
  senderId: string;
  isOwn: boolean;
  timestamp: Date;
}

type RoomState = 'idle' | 'searching' | 'connected' | 'peer-disconnected';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [FormsModule, DatePipe, SearchOverlayComponent],
  template: `
    <div class="h-screen pt-16 flex flex-col md:flex-row bg-surface overflow-hidden">

      <!-- Search Overlay -->
      @if (state() === 'searching') {
        <app-search-overlay
          [queuePosition]="queuePosition()"
          (cancel)="cancelSearch()" />
      }

      <!-- Main Video Area -->
      <div class="flex-1 flex flex-col relative">
        <!-- Videos Grid -->
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 md:p-4">
          <!-- Remote Video -->
          <div class="relative rounded-2xl overflow-hidden bg-surface-container-lowest group">
            <video #remoteVideo autoplay playsinline
                   class="w-full h-full object-cover"></video>
            <!-- Overlay when no peer -->
            @if (state() !== 'connected') {
              <div class="absolute inset-0 flex items-center justify-center bg-surface-container-lowest">
                <div class="text-center">
                  <span class="material-symbols-outlined text-6xl text-outline-variant/30">person_off</span>
                  <p class="mt-2 text-on-surface-variant text-body-md">
                    {{ state() === 'idle' ? 'Click "Start" to find someone' : 'Searching...' }}
                  </p>
                </div>
              </div>
            }
            <!-- Stranger badge -->
            @if (state() === 'connected') {
              <div class="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                <span class="w-2 h-2 rounded-full bg-green-400"></span>
                <span class="text-label-sm text-on-surface font-display">Stranger</span>
              </div>
            }
            <!-- Connection state -->
            @if (state() === 'connected') {
              <div class="absolute top-4 right-4 px-3 py-1.5 rounded-full glass">
                <span class="text-label-sm font-display"
                      [class.text-green-400]="webrtcService.connectionState() === 'connected'"
                      [class.text-yellow-400]="webrtcService.connectionState() === 'connecting'"
                      [class.text-red-400]="webrtcService.connectionState() === 'failed'">
                  {{ webrtcService.connectionState() }}
                </span>
              </div>
            }
            <!-- Video gradient mask -->
            <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-container-lowest/80 to-transparent"></div>
          </div>

          <!-- Local Video -->
          <div class="relative rounded-2xl overflow-hidden bg-surface-container-low">
            <video #localVideo autoplay playsinline muted
                   class="w-full h-full object-cover mirror"></video>
            <div class="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full glass">
              <span class="text-label-sm text-neon-cyan font-display">You</span>
            </div>
            <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-container-low/80 to-transparent"></div>
          </div>
        </div>

        <!-- Control Bar -->
        <div class="flex items-center justify-center gap-3 p-4 bg-surface-container/60 backdrop-blur-md border-t border-outline-variant/20">
          <!-- Mic Toggle -->
          <button (click)="webrtcService.toggleMute()"
                  class="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                  [class]="webrtcService.isMuted() ? 'bg-error/20 border border-error/40 text-error' : 'bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest'">
            <span class="material-symbols-outlined">{{ webrtcService.isMuted() ? 'mic_off' : 'mic' }}</span>
          </button>

          <!-- Camera Toggle -->
          <button (click)="webrtcService.toggleCamera()"
                  class="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                  [class]="webrtcService.isCameraOff() ? 'bg-error/20 border border-error/40 text-error' : 'bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest'">
            <span class="material-symbols-outlined">{{ webrtcService.isCameraOff() ? 'videocam_off' : 'videocam' }}</span>
          </button>

          <!-- Screen Share -->
          <button (click)="webrtcService.toggleScreenShare()"
                  class="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                  [class]="webrtcService.isScreenSharing() ? 'bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan' : 'bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest'">
            <span class="material-symbols-outlined">screen_share</span>
          </button>

          <!-- Spacer -->
          <div class="w-px h-8 bg-outline-variant/30 mx-2"></div>

          <!-- Start / Next -->
          @if (state() === 'idle' || state() === 'peer-disconnected') {
            <button (click)="startSearch()"
                    class="btn-primary px-8 neon-glow-cyan">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined">search</span>
                Start
              </span>
            </button>
          }

          @if (state() === 'connected') {
            <button (click)="nextUser()"
                    class="btn-primary px-8">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined">skip_next</span>
                Next
              </span>
            </button>
          }

          <!-- End Session -->
          @if (state() === 'connected' || state() === 'searching') {
            <button (click)="endSession()"
                    class="btn-danger px-6">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined">call_end</span>
                Stop
              </span>
            </button>
          }

          <!-- Spacer -->
          <div class="w-px h-8 bg-outline-variant/30 mx-2"></div>

          <!-- Report -->
          @if (state() === 'connected') {
            <button (click)="reportPeer()"
                    class="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/30
                           flex items-center justify-center text-on-surface-variant hover:text-error hover:border-error/30 transition-all">
              <span class="material-symbols-outlined">flag</span>
            </button>
          }

          <!-- Chat Sidebar Toggle (mobile) -->
          <button (click)="showChat.set(!showChat())"
                  class="md:hidden w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/30
                         flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all">
            <span class="material-symbols-outlined">chat</span>
          </button>
        </div>

        <!-- Peer Disconnected Overlay -->
        @if (state() === 'peer-disconnected') {
          <div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 mt-16">
            <div class="glass-strong p-8 rounded-2xl text-center max-w-sm mx-4 animate-scaleIn">
              <span class="material-symbols-outlined text-5xl text-error mb-4">person_off</span>
              <h3 class="font-display font-bold text-headline-md text-on-surface mb-2">Peer Disconnected</h3>
              <p class="text-body-md text-on-surface-variant mb-6">Your chat partner has left. Find someone new?</p>
              <div class="flex gap-3 justify-center">
                <button (click)="startSearch()" class="btn-primary px-6">
                  <span class="flex items-center gap-2">
                    <span class="material-symbols-outlined">search</span> Find Next
                  </span>
                </button>
                <button (click)="goHome()" class="btn-ghost px-6">Leave</button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Chat Sidebar -->
      <aside class="w-full md:w-[380px] flex flex-col bg-surface-container/40 backdrop-blur-md border-l border-outline-variant/20"
             [class.hidden]="!showChat() && state() !== 'connected'"
             [class.md:flex]="true"
             [class.fixed]="showChat()"
             [class.md:relative]="true"
             [class.inset-0]="showChat()"
             [class.z-40]="showChat()"
             [class.pt-16]="showChat()">

        <!-- Chat Header -->
        <div class="flex items-center justify-between p-4 border-b border-outline-variant/20">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-neon-cyan">chat</span>
            <span class="font-display font-semibold text-on-surface">Live Chat</span>
            @if (isTyping()) {
              <span class="text-label-sm text-neon-cyan animate-pulse">typing...</span>
            }
          </div>
          <button (click)="showChat.set(false)" class="md:hidden text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Messages -->
        <div #chatContainer class="flex-1 overflow-y-auto p-4 space-y-3">
          @for (msg of messages(); track msg.timestamp) {
            <div class="flex" [class.justify-end]="msg.isOwn">
              <div class="max-w-[80%] p-3 rounded-2xl text-body-md"
                   [class]="msg.isOwn
                     ? 'bg-neon-cyan/20 text-on-surface rounded-br-md'
                     : 'bg-surface-container-high text-on-surface rounded-bl-md'">
                {{ msg.content }}
                <div class="text-label-sm text-on-surface-variant/50 mt-1">
                  {{ msg.timestamp | date:'HH:mm' }}
                </div>
              </div>
            </div>
          }

          @if (messages().length === 0 && state() === 'connected') {
            <div class="text-center text-on-surface-variant/50 py-8">
              <span class="material-symbols-outlined text-3xl mb-2">chat_bubble_outline</span>
              <p class="text-body-md">Say hello! 👋</p>
            </div>
          }
        </div>

        <!-- Chat Input -->
        <div class="p-4 border-t border-outline-variant/20">
          <div class="flex items-center gap-2">
            <input #chatInput
                   [(ngModel)]="messageText"
                   (keydown.enter)="sendMessage()"
                   (input)="onTyping()"
                   [disabled]="state() !== 'connected'"
                   type="text"
                   placeholder="Type a message..."
                   class="flex-1 px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30
                          text-on-surface placeholder:text-outline focus:outline-none focus:border-neon-cyan/50
                          transition-all disabled:opacity-50">
            <button (click)="sendMessage()"
                    [disabled]="state() !== 'connected' || !messageText.trim()"
                    class="w-11 h-11 rounded-xl bg-neon-cyan/20 border border-neon-cyan/30
                           flex items-center justify-center text-neon-cyan
                           hover:bg-neon-cyan/30 transition-all disabled:opacity-30">
              <span class="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .mirror { transform: scaleX(-1); }
    video { background-color: #0c0e18; }
  `]
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatContainer') chatContainerRef!: ElementRef<HTMLDivElement>;

  state = signal<RoomState>('idle');
  messages = signal<ChatMsg[]>([]);
  messageText = '';
  showChat = signal(false);
  isTyping = signal(false);
  queuePosition = signal(0);
  currentSessionId = '';

  private subs: Subscription[] = [];
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public socketService: SocketService,
    public webrtcService: WebrtcService,
    private authService: AuthService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    // Ensure socket connected
    this.socketService.connect();

    // Start local video
    try {
      const stream = await this.webrtcService.startLocalStream();
      if (this.localVideoRef) {
        this.localVideoRef.nativeElement.srcObject = stream;
      }
    } catch (e) {
      console.error('Camera access denied:', e);
    }

    // Local stream ready
    this.subs.push(
      this.webrtcService.localStream$.subscribe(stream => {
        if (this.localVideoRef) {
          this.localVideoRef.nativeElement.srcObject = stream;
        }
      })
    );

    // Remote stream
    this.subs.push(
      this.webrtcService.remoteStream$.subscribe(stream => {
        if (this.remoteVideoRef) {
          this.remoteVideoRef.nativeElement.srcObject = stream;
        }
      })
    );

    // Match found
    this.subs.push(
      this.socketService.matchFound$.subscribe(async (match) => {
        this.state.set('connected');
        this.currentSessionId = match.sessionId;
        this.messages.set([]);
        this.showChat.set(true);
        await this.webrtcService.createPeerConnection(match.peerSocketId, match.initiator);
      })
    );

    // Chat messages
    this.subs.push(
      this.socketService.chatMessage$.subscribe((msg) => {
        const userId = this.authService.currentUser()?.userId;
        this.messages.update(msgs => [...msgs, {
          content: msg.content,
          senderId: msg.senderId,
          isOwn: msg.senderId === userId,
          timestamp: new Date(msg.timestamp),
        }]);
      })
    );

    // Peer disconnected
    this.subs.push(
      this.socketService.peerDisconnected$.subscribe(() => {
        this.state.set('peer-disconnected');
        this.webrtcService.cleanup();
      })
    );

    // Typing indicators
    this.subs.push(
      this.socketService.typing$.subscribe(() => this.isTyping.set(true)),
      this.socketService.stopTyping$.subscribe(() => this.isTyping.set(false)),
    );

    // Queue joined
    this.subs.push(
      this.socketService.queueJoined$.subscribe(data => {
        this.queuePosition.set(data.position);
      })
    );

    // Searching event
    this.subs.push(
      this.socketService.searching$.subscribe(() => {
        this.state.set('searching');
      })
    );
  }

  ngAfterViewChecked(): void {
    this.scrollChatToBottom();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.webrtcService.cleanup();
    this.socketService.endSession();
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
  }

  startSearch(): void {
    this.state.set('searching');
    this.messages.set([]);
    this.socketService.joinQueue();
  }

  cancelSearch(): void {
    this.state.set('idle');
    this.socketService.leaveQueue();
  }

  nextUser(): void {
    this.webrtcService.cleanup();
    this.state.set('searching');
    this.messages.set([]);
    this.socketService.nextUser();
  }

  endSession(): void {
    this.webrtcService.cleanup();
    this.socketService.endSession();
    this.state.set('idle');
    this.messages.set([]);
  }

  sendMessage(): void {
    const text = this.messageText.trim();
    if (!text) return;

    this.socketService.sendChatMessage(text);

    const userId = this.authService.currentUser()?.userId || '';
    this.messages.update(msgs => [...msgs, {
      content: text,
      senderId: userId,
      isOwn: true,
      timestamp: new Date(),
    }]);

    this.messageText = '';
    this.socketService.sendStopTyping();
  }

  onTyping(): void {
    this.socketService.sendTyping();
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.socketService.sendStopTyping();
    }, 2000);
  }

  reportPeer(): void {
    // In production, open a report modal
    alert('Report submitted. Thank you for helping keep the community safe.');
  }

  goHome(): void {
    this.webrtcService.cleanup();
    this.router.navigate(['/']);
  }

  private scrollChatToBottom(): void {
    if (this.chatContainerRef) {
      const el = this.chatContainerRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
