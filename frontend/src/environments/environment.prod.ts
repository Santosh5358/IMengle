export const environment = {
  production: true,
  apiUrl: 'https://imengle.onrender.com/api',
  socketUrl: 'https://imengle.onrender.com',
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }
};
