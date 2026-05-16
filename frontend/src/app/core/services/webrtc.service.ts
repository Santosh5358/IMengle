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
  readonly isScreenSharing = signal(false);

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
      audio: true,
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

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams[0]) {
        this.remoteStream$.next(event.streams[0]);
      }
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
      const offer = await this.peerConnection.createOffer();
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

  async toggleScreenShare(): Promise<void> {
    if (this.isScreenSharing()) {
      // Switch back to camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
      this.isScreenSharing.set(false);
    } else {
      // Start screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
      if (sender && screenTrack) {
        await sender.replaceTrack(screenTrack);
        screenTrack.onended = () => this.toggleScreenShare();
      }
      this.isScreenSharing.set(true);
    }
  }

  cleanup(): void {
    this.peerConnection?.close();
    this.peerConnection = null;
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.peerSocketId = null;
    this.connectionState.set('new');
    this.isMuted.set(false);
    this.isCameraOff.set(false);
    this.isScreenSharing.set(false);
  }
}
