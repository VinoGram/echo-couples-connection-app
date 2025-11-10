const net = require('net');

const cache = new Map();

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const command = data.toString().trim().split(' ');
    const cmd = command[0].toLowerCase();
    
    switch (cmd) {
      case 'set':
        const [, key, flags, exptime, bytes] = command;
        cache.set(key, { value: '', expires: Date.now() + (parseInt(exptime) * 1000) });
        socket.write('STORED\r\n');
        break;
        
      case 'get':
        const getKey = command[1];
        const item = cache.get(getKey);
        if (item && Date.now() < item.expires) {
          socket.write(`VALUE ${getKey} 0 ${item.value.length}\r\n${item.value}\r\nEND\r\n`);
        } else {
          socket.write('END\r\n');
        }
        break;
        
      default:
        socket.write('ERROR\r\n');
    }
  });
});

server.listen(11211, () => {
  console.log('Memcached server running on port 11211');
});