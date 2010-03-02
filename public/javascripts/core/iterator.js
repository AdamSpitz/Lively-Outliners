Object.subclass("Iterator", {
  initialize: function(obj, methodName) {
    this._object = obj;
    this._methodName = methodName;
  },

  _each: function(f) {
    return this._object[this._methodName].call(this._object, f);
  },
});

Object.extend(Iterator.prototype, Enumerable);
