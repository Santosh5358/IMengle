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

type RoomState = 'idle' | 'searching' | 'connected';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [FormsModule, DatePipe, SearchOverlayComponent],
  template: `
    <div class="h-[100dvh] pt-16 flex flex-col md:flex-row bg-surface overflow-hidden">

      <!-- Search Overlay -->
      @if (state() === 'searching') {
        <app-search-overlay
          [queuePosition]="queuePosition()"
          (cancel)="cancelSearch()" />
      }

      <!-- Gender Preference Modal -->
      @if (showPreferences()) {
        <div class="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md mt-16">
          <div class="relative p-8 rounded-3xl max-w-md w-full mx-4 animate-scaleIn overflow-hidden
                      bg-gradient-to-br from-surface-container-high/95 to-surface-container/95
                      border border-outline-variant/20 shadow-2xl shadow-neon-cyan/5">
            <!-- Decorative glow circles -->
            <div class="absolute -top-20 -left-20 w-40 h-40 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-20 -right-20 w-40 h-40 bg-neon-magenta/10 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Header -->
            <div class="relative text-center mb-8">
              <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 border border-outline-variant/20 mb-4">
                <span class="material-symbols-outlined text-3xl text-neon-cyan">diversity_3</span>
              </div>
              <h2 class="font-display font-bold text-headline-md text-on-surface mb-1">Find Your Match</h2>
              <p class="text-body-md text-on-surface-variant">Who would you like to connect with?</p>
            </div>

            <!-- Gender Options -->
            <div class="relative grid grid-cols-3 gap-3 mb-8">
              <!-- Male -->
              <button (click)="selectedGender = 'male'"
                      class="group relative p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer"
                      [class]="selectedGender === 'male'
                        ? 'bg-gradient-to-b from-neon-cyan/20 to-neon-cyan/5 border-2 border-neon-cyan shadow-lg shadow-neon-cyan/20 scale-[1.02]'
                        : 'bg-surface-container-low/50 border-2 border-outline-variant/20 hover:border-neon-cyan/40 hover:bg-neon-cyan/5 hover:scale-[1.01]'">
                <div class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                     [class]="selectedGender === 'male' ? 'bg-neon-cyan/20' : 'bg-surface-container-high group-hover:bg-neon-cyan/10'">
                  <span class="material-symbols-outlined text-2xl transition-colors duration-300"
                        [class]="selectedGender === 'male' ? 'text-neon-cyan' : 'text-on-surface-variant group-hover:text-neon-cyan'">male</span>
                </div>
                <span class="font-display font-semibold text-label-md transition-colors duration-300"
                      [class]="selectedGender === 'male' ? 'text-neon-cyan' : 'text-on-surface-variant group-hover:text-on-surface'">Male</span>
                @if (selectedGender === 'male') {
                  <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
                    <span class="material-symbols-outlined text-xs text-surface">check</span>
                  </div>
                }
              </button>

              <!-- Female -->
              <button (click)="selectedGender = 'female'"
                      class="group relative p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer"
                      [class]="selectedGender === 'female'
                        ? 'bg-gradient-to-b from-neon-magenta/20 to-neon-magenta/5 border-2 border-neon-magenta shadow-lg shadow-neon-magenta/20 scale-[1.02]'
                        : 'bg-surface-container-low/50 border-2 border-outline-variant/20 hover:border-neon-magenta/40 hover:bg-neon-magenta/5 hover:scale-[1.01]'">
                <div class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                     [class]="selectedGender === 'female' ? 'bg-neon-magenta/20' : 'bg-surface-container-high group-hover:bg-neon-magenta/10'">
                  <span class="material-symbols-outlined text-2xl transition-colors duration-300"
                        [class]="selectedGender === 'female' ? 'text-neon-magenta' : 'text-on-surface-variant group-hover:text-neon-magenta'">female</span>
                </div>
                <span class="font-display font-semibold text-label-md transition-colors duration-300"
                      [class]="selectedGender === 'female' ? 'text-neon-magenta' : 'text-on-surface-variant group-hover:text-on-surface'">Female</span>
                @if (selectedGender === 'female') {
                  <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-magenta flex items-center justify-center">
                    <span class="material-symbols-outlined text-xs text-surface">check</span>
                  </div>
                }
              </button>

              <!-- Anyone -->
              <button (click)="selectedGender = ''"
                      class="group relative p-5 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer"
                      [class]="selectedGender === ''
                        ? 'bg-gradient-to-b from-neon-lime/20 to-neon-lime/5 border-2 border-neon-lime shadow-lg shadow-neon-lime/20 scale-[1.02]'
                        : 'bg-surface-container-low/50 border-2 border-outline-variant/20 hover:border-neon-lime/40 hover:bg-neon-lime/5 hover:scale-[1.01]'">
                <div class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                     [class]="selectedGender === '' ? 'bg-neon-lime/20' : 'bg-surface-container-high group-hover:bg-neon-lime/10'">
                  <span class="material-symbols-outlined text-2xl transition-colors duration-300"
                        [class]="selectedGender === '' ? 'text-neon-lime' : 'text-on-surface-variant group-hover:text-neon-lime'">groups</span>
                </div>
                <span class="font-display font-semibold text-label-md transition-colors duration-300"
                      [class]="selectedGender === '' ? 'text-neon-lime' : 'text-on-surface-variant group-hover:text-on-surface'">Anyone</span>
                @if (selectedGender === '') {
                  <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-lime flex items-center justify-center">
                    <span class="material-symbols-outlined text-xs text-surface">check</span>
                  </div>
                }
              </button>
            </div>

            <!-- Action Button -->
            <button (click)="confirmPreferences()"
                    class="relative w-full py-4 rounded-2xl font-display font-bold text-label-md
                           bg-gradient-to-r from-neon-cyan via-neon-cyan to-neon-magenta
                           text-surface transition-all duration-300
                           hover:shadow-lg hover:shadow-neon-cyan/30 hover:scale-[1.01] active:scale-[0.99]">
              <span class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-xl">bolt</span>
                Start Matching
              </span>
            </button>
          </div>
        </div>
      }

      <!-- Main Video Area -->
      <div class="flex-1 flex flex-col relative min-h-0">
        <!-- Videos Grid -->
        <div class="flex-1 relative p-2 md:p-4 min-h-0">
          <!-- Remote Video (full area) -->
          <div class="relative rounded-2xl overflow-hidden bg-surface-container-lowest w-full h-full">
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
                <span class="text-label-sm text-on-surface font-display">{{ peerName() }}</span>
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

          <!-- Local Video (PiP overlay) -->
          <div class="absolute bottom-4 right-4 w-28 h-36 md:w-48 md:h-36 rounded-xl overflow-hidden bg-surface-container-low shadow-lg border border-outline-variant/30 z-10">
            <video #localVideo autoplay playsinline muted volume="0"
                   class="w-full h-full object-cover mirror"></video>
            <div class="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full glass">
              <span class="text-label-sm text-neon-cyan font-display">You</span>
            </div>
          </div>
        </div>

        <!-- Control Bar -->
        <div class="flex items-center justify-between md:justify-center gap-1 md:gap-2 p-1.5 md:p-3 bg-surface-container/60 backdrop-blur-md border-t border-outline-variant/20 flex-shrink-0">
          <!-- Mic Toggle -->
          <button (click)="webrtcService.toggleMute()"
                  class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all"
                  [class]="webrtcService.isMuted() ? 'bg-error/20 border border-error/40 text-error' : 'bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest'">
            <span class="material-symbols-outlined text-[20px] md:text-[24px]">{{ webrtcService.isMuted() ? 'mic_off' : 'mic' }}</span>
          </button>

          <!-- Camera Toggle -->
          <button (click)="webrtcService.toggleCamera()"
                  class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all"
                  [class]="webrtcService.isCameraOff() ? 'bg-error/20 border border-error/40 text-error' : 'bg-surface-container-high border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest'">
            <span class="material-symbols-outlined text-[20px] md:text-[24px]">{{ webrtcService.isCameraOff() ? 'videocam_off' : 'videocam' }}</span>
          </button>

          <!-- Spacer -->
          <div class="w-px h-6 md:h-8 bg-outline-variant/30 mx-0.5 md:mx-1"></div>

          <!-- Start / Next -->
          @if (state() === 'idle') {
            <button (click)="startSearch()"
                    class="compact-action-btn btn-primary px-3 md:px-8 py-2 md:py-3 neon-glow-cyan text-xs md:text-sm">
              <span class="flex items-center gap-1 md:gap-2">
                <span class="material-symbols-outlined text-[18px] md:text-[24px]">search</span>
                <span class="compact-action-label">Start</span>
              </span>
            </button>
          }

          @if (state() === 'connected') {
            <button (click)="nextUser()"
                    class="compact-action-btn btn-primary px-3 md:px-8 py-2 md:py-3 text-xs md:text-sm">
              <span class="flex items-center gap-1 md:gap-2">
                <span class="material-symbols-outlined text-[18px] md:text-[24px]">skip_next</span>
                <span class="compact-action-label">Next</span>
              </span>
            </button>
          }

          <!-- End Session -->
          @if (state() === 'connected' || state() === 'searching') {
            <button (click)="endSession()"
                  class="compact-action-btn btn-danger px-2.5 md:px-5 py-2 md:py-3 text-xs md:text-sm">
              <span class="flex items-center gap-1 md:gap-2">
                <span class="material-symbols-outlined text-[18px] md:text-[24px]">call_end</span>
                <span class="compact-action-label">Stop</span>
              </span>
            </button>
          }

          <!-- Spacer -->
          <div class="w-px h-6 md:h-8 bg-outline-variant/30 mx-0.5 md:mx-1"></div>

          <!-- Report -->
          @if (state() === 'connected') {
            <button (click)="reportPeer()"
                    class="hidden md:flex w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/30
                           items-center justify-center text-on-surface-variant hover:text-error hover:border-error/30 transition-all">
              <span class="material-symbols-outlined">flag</span>
            </button>
          }

          <!-- Chat Sidebar Toggle (mobile) -->
          <button (click)="showChat.set(!showChat())"
                  class="md:hidden w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/30
                         flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all">
            <span class="material-symbols-outlined text-[20px]">chat</span>
          </button>
        </div>
      </div>

      <!-- Chat Sidebar -->
      <aside class="md:w-[380px] flex flex-col bg-surface-container/40 backdrop-blur-md border-l border-outline-variant/20
                     md:relative md:flex"
             [class.hidden]="!showChat()"
             [class.fixed]="showChat()"
             [class.inset-0]="showChat()"
             [class.z-40]="showChat()"
             [class.pt-16]="showChat()"
             [class.md:block]="state() === 'connected'">>

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

    @media (max-width: 380px) {
      .compact-action-label {
        display: none;
      }

      .compact-action-btn {
        min-width: 40px;
        padding-left: 0.65rem;
        padding-right: 0.65rem;
      }
    }
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
  showPreferences = signal(false);
  selectedGender = '';
  peerName = signal('Stranger');
  private hasStartupPreference = false;

  private subs: Subscription[] = [];
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private searchRelaxTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public socketService: SocketService,
    public webrtcService: WebrtcService,
    private authService: AuthService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const storedGender = sessionStorage.getItem('anonconnect.preferredGender');
    if (storedGender !== null) {
      this.selectedGender = storedGender;
      this.hasStartupPreference = true;
    }

    // Ensure socket connected
    this.socketService.connect();

    // Start local video
    try {
      const stream = await this.webrtcService.startLocalStream();
      if (this.localVideoRef) {
        this.localVideoRef.nativeElement.srcObject = stream;
        this.localVideoRef.nativeElement.volume = 0;
        this.localVideoRef.nativeElement.muted = true;
      }
    } catch (e) {
      console.error('Camera access denied:', e);
    }

    // Local stream ready
    this.subs.push(
      this.webrtcService.localStream$.subscribe(stream => {
        if (this.localVideoRef) {
          this.localVideoRef.nativeElement.srcObject = stream;
          this.localVideoRef.nativeElement.volume = 0;
          this.localVideoRef.nativeElement.muted = true;
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
        this.clearSearchRelaxTimer();
        this.state.set('connected');
        this.currentSessionId = match.sessionId;
        this.peerName.set(match.peerName || 'Stranger');
        this.messages.set([]);
        this.showChat.set(true);
        await this.webrtcService.createPeerConnection(match.peerSocketId, match.initiator);
      })
    );

    // Chat messages (only from peer — own messages are added locally in sendMessage)
    this.subs.push(
      this.socketService.chatMessage$.subscribe((msg) => {
        this.messages.update(msgs => [...msgs, {
          content: msg.content,
          senderId: msg.senderId,
          isOwn: false,
          timestamp: new Date(msg.timestamp),
        }]);
      })
    );

    // Peer disconnected — auto-search for next person
    this.subs.push(
      this.socketService.peerDisconnected$.subscribe(() => {
        this.webrtcService.cleanup();
        this.messages.set([]);
        this.isTyping.set(false);
        this.state.set('searching');
        const prefs = this.selectedGender ? { preferredGender: this.selectedGender } : {};
        this.socketService.joinQueue(prefs);
        this.startSearchRelaxTimer();
      })
    );

    // Peer clicked Next — auto-search for new match
    this.subs.push(
      this.socketService.peerNext$.subscribe(() => {
        this.webrtcService.cleanup();
        this.state.set('searching');
        this.messages.set([]);
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
        this.startSearchRelaxTimer();
      })
    );
  }

  ngAfterViewChecked(): void {
    this.scrollChatToBottom();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.webrtcService.fullCleanup();
    this.socketService.endSession();
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.clearSearchRelaxTimer();
  }

  startSearch(): void {
    if (this.hasStartupPreference) {
      this.confirmPreferences();
      return;
    }

    this.showPreferences.set(true);
  }

  confirmPreferences(): void {
    this.hasStartupPreference = true;
    sessionStorage.setItem('anonconnect.preferredGender', this.selectedGender);
    this.showPreferences.set(false);
    this.state.set('searching');
    this.messages.set([]);
    const prefs = this.selectedGender ? { preferredGender: this.selectedGender } : {};
    this.socketService.joinQueue(prefs);
    this.startSearchRelaxTimer();
  }

  skipPreferences(): void {
    this.hasStartupPreference = true;
    this.showPreferences.set(false);
    this.selectedGender = '';
    sessionStorage.setItem('anonconnect.preferredGender', '');
    this.state.set('searching');
    this.messages.set([]);
    this.socketService.joinQueue();
    this.startSearchRelaxTimer();
  }

  cancelSearch(): void {
    this.state.set('idle');
    this.clearSearchRelaxTimer();
    this.socketService.leaveQueue();
  }

  nextUser(): void {
    this.webrtcService.cleanup();
    this.state.set('searching');
    this.messages.set([]);
    this.isTyping.set(false);
    this.socketService.nextUser();
    this.startSearchRelaxTimer();
    // Server re-queues us; we just need to wait for match-found
  }

  endSession(): void {
    this.webrtcService.cleanup();
    this.socketService.endSession();
    this.state.set('idle');
    this.clearSearchRelaxTimer();
    this.peerName.set('Stranger');
    this.messages.set([]);
    this.isTyping.set(false);
  }

  private startSearchRelaxTimer(): void {
    this.clearSearchRelaxTimer();

    // If user already allows anyone, no need to relax filters.
    if (!this.selectedGender) return;

    this.searchRelaxTimer = setTimeout(() => {
      if (this.state() !== 'searching') return;

      // Expand pool after waiting to reduce long search times.
      this.socketService.leaveQueue();
      this.socketService.joinQueue();
      this.queuePosition.set(0);
    }, 12000);
  }

  private clearSearchRelaxTimer(): void {
    if (this.searchRelaxTimer) {
      clearTimeout(this.searchRelaxTimer);
      this.searchRelaxTimer = null;
    }
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
    this.webrtcService.fullCleanup();
    this.router.navigate(['/']);
  }

  private scrollChatToBottom(): void {
    if (this.chatContainerRef) {
      const el = this.chatContainerRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
