let express = require('express')
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let fs = require('fs');
let users = [];

io.on('connection', (socket) => {

  socket.on("message", (message) => {
    io.sockets.emit("serverMessage", message);
    getData((data) => {
      let messages = JSON.parse(data).messages ;
      messages.push(message);
      writeData({ messages });
    });
    console.log(message);
  });

  socket.on("getAllMessages", (user, res) => {
    users.push(user);
    io.sockets.emit("userConnected", user);
    socket['_user'] = user;
    console.log(user.name + ' joined the room');
    getData((data) => {
      res(JSON.parse(data), users);
    });
  });

  socket.on("disconnect", () => {
    let user = socket._user;
    if(user !== undefined) {
      console.log(user.name +' left the room');
      let newusers = users.filter(function(el) {
        return (el.name !== user.name || el.avatar !== user.avatar );
      });
      users = newusers ;
      io.sockets.emit("userDisconnected", socket._user);
    }
  });
});

function getData(callback) { 
    fs.readFile('./src/server/messages.txt', 'utf8', function (err, data) {
        if (err) {
          if (err.code === 'ENOENT') {
            writeData({ messages: [] }, () => {
              callback(JSON.stringify({ messages: [] }));
            }); // create the file if not exists
            return;
          } else {
            throw err;
          }
        }
        callback(data);
    });
}

function writeData(newData, done) {
    fs.writeFile('./src/server/messages.txt', JSON.stringify(newData), function(err) {
        if (err) throw err;
        if (done) done();
    });
}

http.listen(3001, function(){
  console.log('listening on *:3001');
});