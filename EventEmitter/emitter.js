'use strict';

global.EventEmitter = function() {
  this.events = {};
};

EventEmitter.prototype.on = function(name, callback) {
  this.events[name] = this.events[name] || [];
  this.events[name].push(callback);
};

EventEmitter.prototype.emit = function(name, data) {
  var event = this.events[name];
  if (event) event.forEach(function(callback) {
    callback(data);
  });
};

EventEmitter.enhancedEventEmitter = function(argument) {
  var ee = EventEmitter.prototype;
  EventEmitter.prototype.events = EventEmitter.prototype.events || {};
  return ee;
}
