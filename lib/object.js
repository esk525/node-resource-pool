function apply(obj,config){
  if (config) {
    for(var key in config){
      obj[key] = config[key];
    }    
  }
  return obj;
}

function applyIf(obj,config){
  if (config) {
    for(var key in config){
      if(obj[key] === undefined){
        obj[key] = config[key];
      }
    }
  }
  return obj;
}
function extract(obj,propName,delProp) {
  if (!obj ) return null;
  var p;
  p = obj[propName];
  if (delProp) delete obj[propName];
  return p;
}

module.exports = {
  apply : apply,
  applyIf : applyIf,
  extract : extract,
  setEnumerable : function(o,prop,enumerable) {
    if (!o || !o[prop]) return false;
    var d = Object.getOwnPropertyDescriptor(o,prop);
    if (d) {
      d.enumerable = enumerable;
      Object.defineProperty( o, prop, d);
      return true;
    }
    return false;
  }
};