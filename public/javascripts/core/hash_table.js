lobby.transporter.module.create('hash_table', function(requires) {

requires('core', 'lk_TestFramework');

}, function(thisModule) {


thisModule.addSlots(modules.hash_table, function(add) {
    
    add.data('_directory', 'core');

});


thisModule.addSlots(lobby, function(add) {

  add.creator('hashTable', {}, {category: ['collections']}, {comment: 'I don\'t mean to keep this class around forever - hopefully sooner or later Javascript will\rhave a working hash table that can handle arbitrary objects (rather than just strings) as\rkeys. Maybe it exists already, but I couldn\'t find it. So for now I\'ll just use this bloody\rthing. -- Adam', copyDownParents: [{parent: Enumerable}]});

  add.creator('dictionary', Object.create(hashTable), {category: ['collections']});

  add.creator('set', Object.create(hashTable), {category: ['collections']});

});


thisModule.addSlots(Number.prototype, function(add) {

  add.method('hashCode', function () {return this;}, {category: ['hashing']});

  add.method('identityHashCode', function () {return this;}, {category: ['hashing']});

});


thisModule.addSlots(String.prototype, function(add) {

  add.method('hashCode', function () {return this;}, {category: ['hashing']});

  add.method('identityHashCode', function () {return this;}, {category: ['hashing']});

});


thisModule.addSlots(hashTable, function(add) {

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

  add.data('_comparator', hashTable.equalityComparator, {category: ['hashing'], initializeTo: 'hashTable.equalityComparator'});

  add.method('size', function () {
    return this._size;
  }, {category: ['accessing']});

  add.method('isEmpty', function () {
    return this.size() === 0;
  }, {category: ['testing']});

  add.method('bucketForKey', function (k) {
    var bucketName = "bucket_" + this._comparator.hashCodeForKey(k);
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

  add.method('entryForKey', function (k) {
    var b = this.bucketForKey(k);
    return this.entryForKeyInBucket(k, b);
  }, {category: ['hashing']});

  add.method('entryForKeyInBucket', function (k, b) {
    var i = this.indexOfEntryForKeyInBucket(k, b);
    return i === null ? null : b[i];
  }, {category: ['hashing']});

  add.method('indexOfEntryForKeyInBucket', function (k, b) {
    for (var i = 0, n = b.length; i < n; ++i) {
      var entry = b[i];
      if (this._comparator.keysAreEqual(k, this.keyOfEntry(entry))) {
        return i;
      }
    }
    return null;
  }, {category: ['hashing']});

  add.method('put', function (k, v) {
    var b = this.bucketForKey(k);
    var entry = this.entryForKeyInBucket(k, b);
    if (entry) {
      this.setValueOfEntry(entry, v);
      return v;
    } else {
      b.push(this.newEntry(k, v));
      ++this._size;
      return v;
    }
  }, {category: ['accessing']});

  add.method('removeKey', function (k) {
    var b = this.bucketForKey(k);
    var i = this.indexOfEntryForKeyInBucket(k, b);
    if (i !== null) {
      var entry = b.splice(i, 1)[0];
      --this._size;
      return this.valueOfEntry(entry);
    } else {
      return null;
    }
  }, {category: ['accessing']});

  add.method('_each', function (iterator) {
    for (var h in this._buckets) {
      if (this._buckets.hasOwnProperty(h)) {
        var b = this._buckets[h];
        if (b instanceof Array) {
          for (var i = 0, n = b.length; i < n; ++i) {
            var entry = b[i];
            iterator(entry);
          }
        }
      }
    }
  }, {category: ['iterating']});

  add.method('typeName', function () { return "hash table"; }, {category: ['printing']});

  add.method('toString', function () {
    var s = ["a ", this.typeName()];
    if (this._size <= 5) {
      var sep = "";
      s.push("(");
      this._each(function(entry) {
        s.push(sep, this.printEntry(entry));
        sep = ", ";
      }.bind(this));
      s.push(")");
    }
    return s.join("");
  }, {category: ['printing']});

  

});


thisModule.addSlots(hashTable.equalityComparator, function(add) {

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
    return hashTable.identityComparator.hashCodeForKey(k);
  }, {category: ['hashing']});

});


thisModule.addSlots(hashTable.identityComparator, function(add) {

  add.method('keysAreEqual', function (k1, k2) {
    return k1 === k2;
  }, {category: ['hashing']});

  add.method('hashCodeForKey', function (k) {
    // aaa - Blecch, why does JS not support identity hashes?
    if (k.identityHashCode) { return k.identityHashCode(); }
    return 42;
  }, {category: ['hashing']});

});


thisModule.addSlots(dictionary, function(add) {

  add.method('keyOfEntry', function (entry) {
    return entry.key;
  }, {category: ['entries']});

  add.method('valueOfEntry', function (entry) {
    return entry.value;
  }, {category: ['entries']});

  add.method('setValueOfEntry', function (entry, v) {
    entry.value = v;
  }, {category: ['entries']});

  add.method('newEntry', function (k, v) {
    return {key: k, value: v};
  }, {category: ['entries']});

  add.method('printEntry', function (entry) {
    return this.keyOfEntry(entry) + ": " + this.valueOfEntry(entry);
  }, {category: ['entries']});

  add.method('typeName', function () { return "dictionary"; }, {category: ['printing']});

  add.method('get', function (k) {
    var entry = this.entryForKey(k);
    return entry !== null ? this.valueOfEntry(entry) : null;
  }, {category: ['accessing']});

  add.method('set', function (k, v) {
    return this.put(k, v);
  }, {category: ['accessing']});

  add.method('containsKey', function (k) {
    return this.entryForKey(k) !== null;
  }, {category: ['testing']});

  add.method('Tests', function Tests() { Class.initializer.apply(this, arguments); }, {category: ['tests']});

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

  add.method('getOrIfAbsent', function (key, functionWhoseValueToReturnIfAbsent) {
    var v = this.get(key);
    if (v === null) {
      return functionWhoseValueToReturnIfAbsent();
    }
    return v;
  }, {category: ['accessing']});

  add.method('getOrIfAbsentPut', function (key, functionReturningTheValueToPutIfAbsent) {
    // aaa - optimize this to only do one hash lookup?
    var v = this.get(key);
    if (v === null) {
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
    
});


thisModule.addSlots(dictionary.Tests, function(add) {

  add.data('superclass', TestCase);

  add.creator('prototype', Object.create(TestCase.prototype));

  add.data('type', 'dictionary.Tests');

});


thisModule.addSlots(dictionary.Tests.prototype, function(add) {

  add.data('constructor', dictionary.Tests);

  add.method('testGettingAndSetting', function () {
    var h = dictionary.copyRemoveAll();
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
    this.assertEqual(null, h.get({}));
    this.assertEqual(3, h.size());
  });

});


thisModule.addSlots(set, function(add) {

  add.method('keyOfEntry', function (entry) {
    return entry;
  }, {category: ['entries']});

  add.method('valueOfEntry', function (entry) {
    return entry;
  }, {category: ['entries']});

  add.method('setValueOfEntry', function (entry, v) {
  }, {category: ['entries']});

  add.method('newEntry', function (k, v) {
    return k;
  }, {category: ['entries']});

  add.method('printEntry', function (entry) {
    return entry.toString();
  }, {category: ['entries']});

  add.method('typeName', function () { return "set"; }, {category: ['printing']});

  add.method('add', function (v) {
    return this.put(v, v);
  }, {category: ['accessing']});

  add.method('addAll', function (vs) {
    vs.each(function(v) { this.add(v); }.bind(this));
  }, {category: ['accessing']});

  add.method('remove', function (v) {
    return this.removeKey(v);
  }, {category: ['accessing']});

  add.method('contains', function (k) {
    return this.entryForKey(k) !== null;
  }, {category: ['testing']});

  add.method('includes', function (k) {
    return this.contains(k);
  }, {category: ['testing']});

  add.method('include', function (k) {
    return this.contains(k);
  }, {category: ['testing']});

  add.method('Tests', function Tests() { Class.initializer.apply(this, arguments); }, {category: ['tests']});

  add.method('toArray', function () {
    var vs = [];
    this._each(function(entry) {
      vs.push(entry);
    });
    return vs;
  }, {category: ['converting']});

  add.method('copyContaining', function (vs) {
    var s = this.copyRemoveAll();
    s.addAll(vs);
    return s;
  }, {category: ['creating']});
    
});


thisModule.addSlots(set.Tests, function(add) {

  add.data('superclass', TestCase);

  add.creator('prototype', Object.create(TestCase.prototype));

  add.data('type', 'set.Tests');

});


thisModule.addSlots(set.Tests.prototype, function(add) {

  add.data('constructor', set.Tests);

  add.method('testGettingAndSetting', function () {
    var s = set.copyRemoveAll();
    var k1 = {};
    var k2 = {};
    var k3 = pt(5, 6);
    s.add(k1);
    s.add(k2);
    s.add(k3);
    this.assert(s.contains(k1));
    this.assert(s.contains(k2));
    this.assert(s.contains(k3));
    this.assert(! s.contains({}));
    this.assertEqual(3, s.size());
  });

});



});
