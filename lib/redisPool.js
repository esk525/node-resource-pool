var redis       = require('redis');
var url         = require('url');
var util        = require('util');
var ResourcePool = require('./resourcePool');
var oFuncs = require('./object')

module.exports = RedisPool;
util.inherits(RedisPool, ResourcePool);


function RedisPool(config) {
  var defaults = {
    _defaultHost : 'localhost',
    _defaultPort : 6379
  };
  var config = oFuncs.apply(defaults,config);
  ResourcePool.prototype.constructor.call(this,config);
}

RedisPool.singleton = new RedisPool();

RedisPool.prototype.parse = function(dsn) {
  var parsed = url.parse(dsn);
  if (parsed.protocol !== 'redis:') {
    throw new Error('RedisPool.UnknownProtocol: ' + parsed.protocol);
  }

  return {
    host       : parsed.hostname || this._defaultHost,
    port       : parsed.port || this._defaultPort,
    namespace  : (parsed.pathname)
      ? parsed.pathname.substr(1)
      : '',
  };
};

RedisPool.prototype.stringify = function(parsed) {
  return url.format({
    protocol : 'redis:',
    slashes  : true,
    hostname : parsed.host,
    port     : parsed.port,
    pathname : '/' + (parsed.namespace || ''),
  });
};

RedisPool.prototype.alloc = function(dsn, options) {
  this.emit('log', 'Alloc: ' + dsn + ' (' + JSON.stringify(options) + ')');
  var key = [dsn];
  options = oFuncs.apply({},options);
  if (options.subscriber) key.push('subscriber');
  
  key = key.join(':');
  return ResourcePool.prototype.alloc.call(this,key,options);
};


RedisPool.prototype.createResource = function(dsn,config) {
  var parsedDsn = RedisPool.singleton.parse(dsn);  
  return redis.createClient(parsedDsn.port, parsedDsn.host);
};

RedisPool.prototype._onFreeResource = function(resource,resourceType) {
  resource.quit();
  ResourcePool.prototype._onFreeResource.call(this,resource,resourceType);
};

