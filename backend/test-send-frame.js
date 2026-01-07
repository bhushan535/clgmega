const fs = require('fs');
const io = require('socket.io-client');
const path = require('path');

const SOCKET_URL = 'http://localhost:4000';
const client = io(SOCKET_URL);

client.on('connect', () => {
  console.log('connected to backend socket');

  const filePath = path.join(__dirname, 'test.jpg');
  const buf = fs.readFileSync(filePath);
  const b64 = 'data:image/jpeg;base64,' + buf.toString('base64');

  client.emit('frame', {
    sessionId: 'test-sess-1',
    studentId: 'student-1',
    timestamp: new Date().toISOString(),
    imageBase64: b64
  });

  client.on('frame_ack', (ack) => {
    console.log('ACK:', ack);
    setTimeout(() => client.disconnect(), 1000);
  });
});
