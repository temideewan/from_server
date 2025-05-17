const express = require('express');
const server = require('http').createServer();
const app = express();

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

process.on('SIGINT', () => {
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close((err) => {
    console.log(err);
    shutDownDB();
    server.emit('close');
  });
});

server.on('request', app);
server.listen(3000, () => {
  console.log('Server started on port 3000');
});

/**
 * Begin WEB SOCKETS
 */

const webSocketServer = require('ws').Server;

const wss = new webSocketServer({ server });

wss.on('connection', function connection(ws) {
  const numClients = wss.clients.size;
  console.log(`Clients connected ${numClients}`);

  wss.broadcast(`The current visitors: ${numClients}`);
  if (ws.readyState === ws.OPEN) {
    ws.send('Welcome to my server');
  }
  ws.on('close', function close(code) {
    wss.broadcast(`A client has disconnected`);
    console.log('The client has disconnected');
  });

  db.run(`
    INSERT INTO visitors(counts, time) VALUES(${numClients}, datetime('now'))
    `);
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

/** End web sockets */
/** Begin Databases */
const sqlite = require('sqlite3');
const db = new sqlite.Database(':memory:');

db.serialize(() => {
  db.run(`
      CREATE TABLE visitors (
      counts INTEGER,
      time TEXT
      )  
    `);
});

function getCounts() {
  db.each('SELECT * FROM visitors', (err, row) => {
    if (!err) {
      console.log(row);
    }
  });
}

function shutDownDB() {
  getCounts();
  console.log('Shutting down DB');
  db.close();
}
