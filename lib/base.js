var EventEmitter = require('events').EventEmitter;
var util = require('util');
var oFuncs = require('./object');

module.exports = BaseClass;
util.inherits(BaseClass,EventEmitter);


function BaseClass(config,defaults){
  EventEmitter.call(this);
  oFuncs.apply(this,defaults);
  oFuncs.apply(this,config);
}
BaseClass.prototype.executeCallback = function executeCallback(cb) {
  if (typeof cb === 'function') {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.shift();
    cb.apply(this,args);
  }
};
BaseClass.prototype.toString = function(){
  return util.inspect(this,true);
};
