lobby.transporter.module.create('hash_table', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('bloodyHashTable', {}, {category: ['collections']}, {copyDownParents: [{expression: 'Enumerable'}], comment: "I don't mean to keep this class around forever - hopefully sooner or later Javascript will have a working hash table that can handle arbitrary objects (rather than just strings) as keys. Maybe it exists already, but I couldn't find it. So for now I'll just use this bloody thing. -- Adam"});

});


thisModule.addSlots(lobby.bloodyHashTable, function(add) {

  add.method('copyRemoveAll', function () {
    // Should this be called copyRemoveAll or cloneRemoveAll or create or what?
    return Object.newChildOf(this); // aaa - blecch, why again can't I put a "create" method directly on Object.prototype?
  });

  add.method('initialize', function () {
    this._buckets = {};
    this._size = 0;
  });

  add.method('keysAreEqual', function(k1, k2) {
    if (k1 === null || k1 === undefined) {return k2 === null || k2 === undefined;}
    if (k2 === null || k2 === undefined) {return false;}
    if (typeof(k1) !== typeof(k2)) {return false;}
    if (typeof(k1.equals) === 'function') {
      return k1.equals(k2);
    } else {
      return k1 == k2;
    }
  });

  add.method('hashCodeForKey', function(k) {
    // aaa - Blecch, why does JS not support identity hashes?
    if (k.hashCode) { return k.hashCode(); }
    return 42;
  });

  add.method('bucketForKey', function(k) {
    var bucketName = "" + this.hashCodeForKey(k);
    var b = this._buckets[bucketName];
    if (typeof b === "undefined") {
      this._buckets[bucketName] = b = [];
    }
    else {
      if (! this._buckets.hasOwnProperty(bucketName)) {
        // console.log("Bad bucket name: " + bucketName);
        return this.bucketForKey("bucketKeyHack");
      }
    }
    return b;
  });

  add.method('pairForKey', function(k) {
    var b = this.bucketForKey(k);
    for (var i = 0, n = b.length; i < n; ++i) {
      var pair = b[i];
      if (this.keysAreEqual(k, pair.key)) {
        return pair;
      }
    }
    return null;
  });

  add.method('get', function(k) {
    var pair = this.pairForKey(k);
    return pair !== null ? pair.value : null;
  });

  add.method('set', function(k, v) {
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
  });

  add.method('put', function(k, v) {
    return this.set(k, v);
  });

  add.method('containsKey', function(k) {
    var pair = this.pairForKey(k);
    return pair !== null;
  });

  add.method('_each', function(iterator) {
    for (var h in this._buckets) {
      if (this._buckets.hasOwnProperty(h)) {
        var b = this._buckets[h];
        if (b instanceof Array) {
          for (var i = 0, n = b.length; i < n; ++i) {
            var pair = b[i];
            iterator(pair);
          }
        }
      }
    }
  });

  add.method('values', function() {
    var vs = [];
    this._each(function(pair) {
      vs.push(pair.value);
    });
    return vs;
  });

  add.method('toString', function() {
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
  });

  add.method('getOrIfAbsentPut', function(key, functionReturningTheValueToPutIfAbsent) {
    var v = this.get(key);
    if (v == null) {
      v = functionReturningTheValueToPutIfAbsent();
      this.set(key, v);
    }
    return v;
  });

  add.method('eachKeyAndValue', function(f) {
    return this.each(function(pair) {return f(pair.key, pair.value);});
  });

  add.method('eachValue', function(f) {
    return this.each(function(pair) {return f(pair.value);});
  });

  add.method('eachKey', function(f) {
    return this.each(function(pair) {return f(pair.key);});
  });

});


thisModule.addSlots(String.prototype, function(add) {

  add.method('hashCode', function() {return this;});

});


thisModule.addSlots(Number.prototype, function(add) {

  add.method('hashCode', function() {return this;});

});


});
