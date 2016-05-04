global.api = {};
api.fs = require('fs');
api.http = require('http');
api.websocket = require('websocket');
require('../EventEmitter/emitter.js');
api.eventEmitter = EventEmitter.enhancedEventEmitter();
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var index = api.fs.readFileSync('./index.html');

var server = api.http.createServer(function(req, res) {
  res.writeHead(200);
  res.end(index);
});

server.listen(80, function() {
  console.log('Listen port 80');
});

var ws = new api.websocket.server({
  httpServer: server,
  autoAcceptConnections: false
});

var clients = [];
var cells = {};
var regex = /[a-f][1-6]/ig;
var reCalcCell = function(cell, conn) {

  var links = cells[cell]['formula'].match(regex);


  if (links) {
    var temp = cells[cell]['formula'];
    links.forEach(function (el, i, arr) {
      var elUp = el.toUpperCase();
      cells[elUp] = cells[elUp] || {};
      cells[elUp]['links'] = cells[elUp]['links'] || [];
      if (cells[elUp]['links'].indexOf(cell) == -1)
        cells[elUp]['links'].push(cell);

      if (cells[elUp]) {
        temp = temp.replaceAll(el, cells[elUp]['value'] || 'null');
      }
    })
    cells[cell]['value'] = temp;
  } else {
    cells[cell]['value'] = cells[cell]['formula'];
  }
  var senddata = JSON.stringify({'cell' :cell, 'value' : cells[cell]['value']});
  console.log('Send: ' + senddata);
  conn.send(senddata);
  api.eventEmitter.emit('change', {'cell' : cell, 'conn' : conn});
}

api.eventEmitter.on('change', function (data) {
  var links = cells[data['cell']]['links'];
  if (links) {
    links.forEach(function (cell) {
      reCalcCell(cell, data['conn']);
    })
  }
})

ws.on('request', function(req) {
  var connection = req.accept('', req.origin);
  clients.push(connection);
  console.log('Connected ' + connection.remoteAddress);
  connection.on('message', function(message) {
    var dataName = message.type + 'Data',
        data = message[dataName];
    console.log('Received: ' + data);

    data = JSON.parse(data);
    cells[data['cell']] = cells[data['cell']] || {};
    cells[data['cell']]['formula'] = data['value'];

    reCalcCell(data['cell'], connection);


    clients.forEach(function(client) {
      if (connection !== client) {
        client.send(data);
      }
    });
  });
  connection.on('close', function(reasonCode, description) {
    console.log('Disconnected ' + connection.remoteAddress);
  });
});
