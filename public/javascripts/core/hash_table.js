lobby.transporter.module.create('hash_table', function(thisModule) {


thisModule.addSlots(modules.hash_table, function(add) {
    
    add.data('_directory', 'core');

});


thisModule.addSlots(lobby, function(add) {

  add.creator('hashMap', {}, {category: ['collections']}, {comment: 'I don\'t mean to keep this class around forever - hopefully sooner or later Javascript will\rhave a working hash table that can handle arbitrary objects (rather than just strings) as\rkeys. Maybe it exists already, but I couldn\'t find it. So for now I\'ll just use this bloody\rthing. -- Adam', copyDownParents: [{parent: Enumerable}]});

});


thisModule.addSlots(Number.prototype, function(add) {

  add.method('hashCode', function () {return this;}, {category: ['hashing']});

  add.method('identityHashCode', function () {return this;}, {category: ['hashing']});

});


thisModule.addSlots(String.prototype, function(add) {

  add.method('hashCode', function () {return this;}, {category: ['hashing']});

  add.method('identityHashCode', function () {return this;}, {category: ['hashing']});

});


thisModule.addSlots(hashMap, function(add) {

  add.method('copyRemoveAll', function () {
    // Should this be called copyRemoveAll or cloneRemoveAll or create or what?
    return Object.newChildOf(this); // aaa - blecch, why again can't I put a "create" method directly on Object.prototype?;
  }, {category: ['creating']});

  add.method('initialize', function (comparator) {
    this._buckets = {};
    this._size = 0;
    if (comparator) { this._comparator = comparator; }
  }, {category: ['initializing']});

  add.creator('equalityComparator', {}, {category: ['hashing']});

  add.creator('identityComparator', {}, {category: ['hashing']});

  add.data('_comparator', hashMap.equalityComparator, {category: ['hashing'], initializeTo: 'hashMap.equalityComparator'});

  add.method('bucketForKey', function (k) {
    var bucketName = "" + this._comparator.hashCodeForKey(k);
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
  }, {category: ['hashing']});

  add.method('pairForKey', function (k) {
    var b = this.bucketForKey(k);
    return this.pairForKeyInBucket(k, b);
  }, {category: ['hashing']});

  add.method('pairForKeyInBucket', function (k, b) {
    for (var i = 0, n = b.length; i < n; ++i) {
      var pair = b[i];
      if (this._comparator.keysAreEqual(k, pair.key)) {
        return pair;
      }
    }
    return null;
  }, {category: ['hashing']});

  add.method('get', function (k) {
    var pair = this.pairForKey(k);
    return pair !== null ? pair.value : null;
  }, {category: ['accessing']});

  add.method('set', function (k, v) {
    var b = this.bucketForKey(k);
    var pair = this.pairForKeyInBucket(k, b);
    if (pair) {
      pair.value = v;
      return v;
    } else {
      b.push({key: k, value: v});
      ++this._size;
      return v;
    }
  }, {category: ['accessing']});

  add.method('put', function (k, v) {
    return this.set(k, v);
  }, {category: ['accessing']});

  add.method('containsKey', function (k) {
    var pair = this.pairForKey(k);
    return pair !== null;
  }, {category: ['testing']});

  add.method('_each', function (iterator) {
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
  }, {category: ['iterating']});

  add.method('keys', function () {
    var ks = [];
    this._each(function(pair) {
      ks.push(pair.key);
    });
    return ks;
  }, {category: ['accessing']});

  add.method('values', function () {
    var vs = [];
    this._each(function(pair) {
      vs.push(pair.value);
    });
    return vs;
  }, {category: ['accessing']});

  add.method('toString', function () {
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
  }, {category: ['printing']});

  add.method('getOrIfAbsentPut', function (key, functionReturningTheValueToPutIfAbsent) {
    var v = this.get(key);
    if (v == null) {
      v = functionReturningTheValueToPutIfAbsent();
      this.set(key, v);
    }
    return v;
  }, {category: ['accessing']});

  add.method('eachKeyAndValue', function (f) {
    return this.each(function(pair) {return f(pair.key, pair.value);});
  }, {category: ['iterating']});

  add.method('eachValue', function (f) {
    return this.each(function(pair) {return f(pair.value);});
  }, {category: ['iterating']});

  add.method('eachKey', function (f) {
    return this.each(function(pair) {return f(pair.key);});
  }, {category: ['iterating']});

  add.method('Tests', function Tests() { Class.initializer.apply(this, arguments); }, {category: ['tests']});

});


thisModule.addSlots(hashMap.equalityComparator, function(add) {

  add.method('keysAreEqual', function (k1, k2) {
    if (k1 === k2) {return true;}
    if (k1 === null || k1 === undefined) {return k2 === null || k2 === undefined;}
    if (k2 === null || k2 === undefined) {return false;}
    if (typeof(k1) !== typeof(k2)) {return false;}
    if (typeof(k1.equals) === 'function') {
      return k1.equals(k2);
    } else {
      return k1 == k2;
    }
  }, {category: ['hashing']});

  add.method('hashCodeForKey', function (k) {
    if (k.hashCode) { return k.hashCode(); }
    return hashMap.identityComparator.hashCodeForKey(k);
  }, {category: ['hashing']});

});


thisModule.addSlots(hashMap.identityComparator, function(add) {

  add.method('keysAreEqual', function (k1, k2) {
    return k1 === k2;
  }, {category: ['hashing']});

  add.method('hashCodeForKey', function (k) {
    // aaa - Blecch, why does JS not support identity hashes?
    if (k.identityHashCode) { return k.identityHashCode(); }
    return 42;
  }, {category: ['hashing']});

});


thisModule.addSlots(hashMap.Tests, function(add) {

  add.data('superclass', TestCase);

  add.creator('prototype', Object.create(TestCase.prototype));

  add.data('type', 'hashMap.Tests');

});


thisModule.addSlots(hashMap.Tests.prototype, function(add) {

  add.data('constructor', hashMap.Tests);

  add.method('testGettingAndSetting', function () {
    var h = hashMap.copyRemoveAll();
    var k1 = {};
    var k2 = {};
    var k3 = pt(5, 6);
    h.put(k1, "One");
    h.put(k2, 2);
    h.put(k3, "the point (5, 6)");
    this.assertEqual("One", h.get(k1));
    this.assertEqual(2, h.get(k2));
    this.assertEqual("the point (5, 6)", h.get(k3));
    this.assertEqual("the point (5, 6)", h.get(pt(5, 6)), "uses equals() rather than ===");
    this.assertEqual(3, h.size());
  });

});



});
