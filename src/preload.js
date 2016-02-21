/* eslint-disable */
// https://github.com/segmentio/nightmare/blob/master/lib%2Fpreload.js

window.__nixe = {};
__nixe.ipc = require('electron').ipcRenderer;
// __nixe.sliced = require('sliced');

// Listen for error events
window.addEventListener('error', function(e) {
  // __nixe.ipc.send('page', 'error', e.message, e.error.stack);
  __nixe.ipc.send('web', 'page:error', e.message, e.error.stack);
});

(function(){
  // listen for console.log
  var defaultLog = console.log;
  console.log = function() {
    // __nixe.ipc.send('console', 'log', __nixe.sliced(arguments));
    __nixe.ipc.send('web', 'console:log', Array.from(arguments));
    return defaultLog.apply(this, arguments);
  };

  // listen for console.warn
  var defaultWarn = console.warn;
  console.warn = function() {
    // __nixe.ipc.send('console', 'warn', __nixe.sliced(arguments));
    __nixe.ipc.send('web', 'console:warn', Array.from(arguments));
    return defaultWarn.apply(this, arguments);
  };

  // listen for console.error
  var defaultError = console.error;
  console.error = function() {
    // __nixe.ipc.send('console', 'error', __nixe.sliced(arguments));
    __nixe.ipc.send('web', 'console:error', Array.from(arguments));
    return defaultError.apply(this, arguments);
  };

  // overwrite the default alert
  window.alert = function(message){
    __nixe.ipc.send('web', 'page:alert', message);
  };

  // overwrite the default prompt
  window.prompt = function(message, defaultResponse){
    __nixe.ipc.send('web', 'page:prompt', message, defaultResponse);
  }

  // overwrite the default confirm
  window.confirm = function(message, defaultResponse){
    __nixe.ipc.send('web', 'page:confirm', message, defaultResponse);
  }
})()
