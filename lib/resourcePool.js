var BaseClass   = require('./base');
var oFuncs      = require('./object');
var util        = require('util');

module.exports = ResourcePool;
util.inherits(ResourcePool, BaseClass);


function ResourcePool(config) {
  
  var defaults = {
    length: 0,
    _pool: {},
    _exclusive: []
  };
  var config = oFuncs.apply(defaults,config);
  BaseClass.prototype.constructor.call(this,config); 
}


ResourcePool.prototype.allocate = function(uri,options) {
  if (! typeof uri === 'String') {
    throw new Error('ResourcePool.allocate: No unique uri string provided.');
  }  
  var resourceConfig = oFuncs.apply({},options);
  var resourceType = resourceConfig.resourceType || 'pool'
  return (resourceType.toLowerCase() == 'exclusive')
    ? this._allocExclusive(uri,resourceConfig)
    : this._allocInPool(uri,resourceConfig);
};
ResourcePool.prototype.alloc = ResourcePool.prototype.allocate;
ResourcePool.prototype.createResource = function(config){ return {};};
ResourcePool.prototype._createResource = function(uri,config) {
  var resource = this.createResource(uri,config);
  if (typeof resource !== 'object') {
    throw new Error("ResourcePool._createResource: createResource failed");
  }
  resource = oFuncs.applyIf(resource,{ poolURI : uri });
  this.emit("create",this,resource,uri,config);
  return resource;
};

ResourcePool.prototype._allocExclusive = function(uri,config) {
  var resource = this._createResource(uri,config);
  this._exclusive.push(resource);
  this.length++;
  this.emit('allocate',resource,'exclusive',uri,config);
  return resource;
};

ResourcePool.prototype._allocInPool = function(uri,config) {
  var ref = this._pool[uri];

  if (ref) {
    ref.count++;
    return ref.resource;
  }

  this.length++;
  this._pool[uri] = ref = {
    count  : 1,
    resource : this._createResource(uri,config),
  };
  this.emit('allocate',ref.resource,'pool',uri,config);
  return ref.resource;
};

ResourcePool.prototype.free = function(resource, cb) {
  if (this._freePoolResource(resource,cb)) return;
  if (this._freeExclusiveResource(resource,cb)) return;

  var err = new Error(
    'ResourcePool.FreeError: Cannot free unknown resource: ' + resource
  );
  throw err;
};

ResourcePool.prototype._freePoolResource = function(resource,cb) {
  var matchingRef;
  for (var key in this._pool) {
    var ref = this._pool[key];
    if (ref.resource === resource) {
      matchingRef = ref;
      break;
    }
  }

  if (!matchingRef) return false;

  if (!--matchingRef.count) {
    delete this._pool[key];
    this._onFreeResource(ref.resource,"pool");
    this.length--;
  }
  this.executeCallback(cb,this,ref.resource,'pool')
  return true;
};

ResourcePool.prototype._freeExclusiveResource = function(resource,cb) {
  var index = this._exclusive.indexOf(resource);
  if (index === -1) return false;

  this._exclusive.slice(index, 1);
  this.length--;
  this._onFreeResource(resource,"exclusive");  
  this.executeCallback(cb,this,resource,'exclusive')
  return true;
};

ResourcePool.prototype._onFreeResource = function(resource,resourceType) {
  this.emit("free",this,resource,"pool");
};

ResourcePool.prototype.stringify = function(resource){
  return JSON.stringify(resource);
};
ResourcePool.prototype.inspect = function() {
  var exclusive = this._exclusive.map(this.stringify.bind(this));
  var pool = [];
  for (var key in this._pool) {
    var ref = this._pool[key];
    pool.push({key: key, dsn: this.stringify(ref.client), count: ref.count});
  }

  return '<' + this.constructor.name + ' ' + util.inspect({
    length    : this.length,
    pool      : pool,
    exclusive : exclusive,
  }) + '>';
};