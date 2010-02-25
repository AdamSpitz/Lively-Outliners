/*
 * I don't mean to keep this class around forever - hopefully sooner or later Javascript will
 * have a working hash table that can handle arbitrary objects (rather than just strings) as
 * keys. Maybe it exists already, but I couldn't find it. So for now I'll just use this
 * bloody thing. -- Adam
 */

var BloodyHashTable = function() {
  this._buckets = {};
  this._size = 0;
};

// I'd prefer to use a subclass of Array, but that gave me grief on IE.
// Maybe there's a way to do it; try later.
BloodyHashTable.Bucket = Array;

Object.extend(BloodyHashTable.prototype, {

  keysAreEqual: function(k1, k2) {
    if (k1 === null || k1 === undefined) {return k2 === null || k2 === undefined;}
    if (k2 === null || k2 === undefined) {return false;}
    if (typeof(k1) !== typeof(k2)) {return false;}
    if (typeof(k1.equals) === 'function') {
      return k1.equals(k2);
    } else {
      return k1 == k2;
    }
  },

  bucketForKey: function(k) {
    var bucketName = "" + k;
    if (bucketName === 'constructor') { bucketName = 'constructor_key_hack'; }

    var b = this._buckets[bucketName];
    if (typeof b === "undefined") {
      b = new BloodyHashTable.Bucket();
      this._buckets[bucketName] = b;
    }
    //else {
    //  if (! this._buckets.hasOwnProperty(bucketName)) {
    //    console.log("Bad bucket name: " + bucketName);
    //  }
    //}
    return b;
  },

  pairForKey: function(k) {
    var b = this.bucketForKey(k);
    for (var i = 0, n = b.length; i < n; ++i) {
      var pair = b[i];
      //if (!pair) {console.log("Huh? b.length is " + b.length + ", b itself is " + b + ", hasOwnProperty is " + this._buckets.hasOwnProperty(k));}
      if (this.keysAreEqual(k, pair.key)) {
        return pair;
      }
    }
    return null;
  },

  get: function(k) {
    var pair = this.pairForKey(k);
    return pair !== null ? pair.value : null;
  },

  set: function(k, v) {
    var b = this.bucketForKey(k);
    for (var i = 0, n = b.length; i < n; ++i) {
      var pair = b[i];
      if (this.keysAreEqual(k, pair.key)) {
        pair.value = v;
        return v;
      }
    }
    b.push({key: k, value: v});
    ++this._size;
    return v;
  },

  put: function(k, v) {
    return this.set(k, v);
  },

  containsKey: function(k) {
    var pair = this.pairForKey(k);
    return pair !== null;
  },

  _each: function(iterator) {
    for (var h in this._buckets) {
      if (this._buckets.hasOwnProperty(h)) {
        var b = this._buckets[h];
        if (b instanceof BloodyHashTable.Bucket) {
          for (var i = 0, n = b.length; i < n; ++i) {
            var pair = b[i];
            iterator(pair);
          }
        }
      }
    }
  },

  values: function() {
    var vs = [];
    this._each(function(v) {
      vs.push(v);
    });
    return vs;
  },

  toString: function() {
    if (this._size > 5) {return "a hash table";}
    var s = ["a hash table"];
    var sep = "";
    s.push("(");
    this._each(function(pair) {
      s.push(sep);
      s.push(pair.key);
      s.push(": ");
      s.push(pair.value);
      sep = ", ";
    });
    s.push(")");
    return s.join("");
  }

});
