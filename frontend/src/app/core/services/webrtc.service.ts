import { Injectable, signal } from '@angular/core';
import { SocketService } from './socket.service';
import { environment } from '@env/environment';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebrtcService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private peerSocketId: string | null = null;

  readonly localStream$ = new Subject<MediaStream>();
  readonly remoteStream$ = new Subject<MediaStream>();
  readonly connectionState = signal<RTCPeerConnectionState>('new');
  readonly isMuted = signal(false);
  readonly isCameraOff = signal(false);

  constructor(private socketService: SocketService) {
    this.setupSignalingListeners();
  }

  private setupSignalingListeners(): void {
    this.socketService.offer$.subscribe(async ({ sdp, fromSocketId }) => {
      this.peerSocketId = fromSocketId;
      await this.handleOffer(sdp);
    });

    this.socketService.answer$.subscribe(async ({ sdp }) => {
      await this.handleAnswer(sdp);
    });

    this.socketService.iceCandidate$.subscribe(async ({ candidate }) => {
      await this.handleIceCandidate(candidate);
    });
  }

  async startLocalStream(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.localStream$.next(this.localStream);
    return this.localStream;
  }

  async createPeerConnection(peerSocketId: string, isInitiator: boolean): Promise<void> {
    this.peerSocketId = peerSocketId;
    this.peerConnection = new RTCPeerConnection({
      iceServers: environment.webrtc.iceServers,
    });

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream — emit as soon as any track arrives
    const remoteStream = new MediaStream();
    this.peerConnection.ontrack = (event) => {
      remoteStream.addTrack(event.track);
      this.remoteStream$.next(remoteStream);
    };

    // ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.peerSocketId) {
        this.socketService.sendIceCandidate(this.peerSocketId, event.candidate.toJSON());
      }
    };

    // Connection state
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        this.connectionState.set(this.peerConnection.connectionState);
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.peerConnection.setLocalDescription(offer);
      this.socketService.sendOffer(peerSocketId, offer);
    }
  }

  private async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      await this.createPeerConnection(this.peerSocketId!, false);
    }
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    this.socketService.sendAnswer(this.peerSocketId!, answer);
  }

  private async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  toggleMute(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted.set(!audioTrack.enabled);
      }
    }
  }

  toggleCamera(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isCameraOff.set(!videoTrack.enabled);
      }
    }
  }

  cleanup(): void {
    this.peerConnection?.close();
    this.peerConnection = null;
    // Keep local stream alive so camera stays on between sessions
    this.peerSocketId = null;
    this.connectionState.set('new');
  }

  fullCleanup(): void {
    this.cleanup();
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.isMuted.set(false);
    this.isCameraOff.set(false);
  }
}
