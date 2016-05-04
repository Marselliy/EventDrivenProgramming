'use strict';

global.EventEmitter = {};
require('./emitter.js');
global.application = EventEmitter.enhancedEventEmitter();

application.on('smth', function(data) {
  console.dir(data);
});

application.on('*', function(name, data) {
  console.dir([name, data]);
});

application.emit('smth', { a: 5 });
