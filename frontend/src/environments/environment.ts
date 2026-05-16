export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  socketUrl: 'http://localhost:9092',
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }
};
