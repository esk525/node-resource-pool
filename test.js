var ResourcePool = require('./index');
var oFuncs = require('./lib/object');
var assert = require('assert');

var createResource = function(uri,config) { return oFuncs.apply({},config); };

var cb = function cb(){ console.log('in cb'); };

var cfg = {'createResource': createResource};
(function testAlloc() {
  (function testReturnsResource() {
    var pool = new ResourcePool(cfg);
    var client = pool.alloc('redis://localhost/',{ host : 'localhost' });
    assert.equal(client.host, 'localhost');
  })();

  (function testAllocationPool() {
    
    var pool = new ResourcePool(cfg);
    assert.equal(pool.length, 0);

    var a = pool.alloc('redis://localhost/');
    assert.equal(pool.length, 1);

    var b = pool.alloc('redis://localhost/');
    assert.equal(pool.length, 1);

    assert.strictEqual(a, b);

    var c = pool.alloc('redis://localhost:9003/');
    assert.equal(pool.length, 2);

    assert.notStrictEqual(a, c);
  })();

  (function testExclusive() {
    var pool = new ResourcePool(cfg);
    assert.equal(pool.length, 0);

    var a = pool.alloc('redis://localhost/', {resourceType: 'exclusive'});
    assert.equal(pool.length, 1);

    var b = pool.alloc('redis://localhost/', {resourceType: 'exclusive'});
    assert.equal(pool.length, 2);

    assert.notStrictEqual(a, b);
  })();
})();

(function testFree() {
  (function testFreeNonExistingClient() {
    var pool = new ResourcePool(cfg);

    assert.throws(function() {
      pool.free({});
    }, /FreeError/);
  })();

  (function testFreePoolClient() {
    var pool = new ResourcePool(cfg);
    var a    = pool.alloc('redis://localhost:9003/')
    var b    = pool.alloc('redis://localhost:9003/')

    var quits = 0;
    pool.on('free',function() {
      quits++;
    });

    pool.free(a);
    assert.equal(pool.length, 1);
    assert.equal(quits, 0);

    pool.free(b);
    assert.equal(pool.length, 0);
    assert.equal(quits, 1);
  })();

  (function testFreeExclusiveClient() {
    var pool = new ResourcePool(cfg);
    var a    = pool.alloc('redis://localhost:9003/', {resourceType: 'exclusive'})
    var b    = pool.alloc('redis://localhost:9003/', {resourceType: 'exclusive'})

    assert.equal(pool.length, 2);

    var quits = 0;
    pool.on('free',function() {
      quits++;
    });

    pool.free(a);
    assert.equal(pool.length, 1);
    assert.equal(quits, 1);
  })();
})();


