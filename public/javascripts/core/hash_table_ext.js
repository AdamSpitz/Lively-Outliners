// aaa - I haven't decided yet whether I actually like the BloodyHashTable object.
// So for now I'm using Prototype's Hash, too.

HashMap = BloodyHashTable;
Hashtable = BloodyHashTable;


CommonHashTableStuff = {
  getOrIfAbsentPut: function(key, functionReturningTheValueToPutIfAbsent) {
    var v = this.get(key);
    if (v == null) {
      v = functionReturningTheValueToPutIfAbsent();
      this.set(key, v);
    }
    return v;
  },

  eachKeyAndValue: function(f) {
    return this.each(function(pair) {return f(pair.key, pair.value);});
  },

  eachValue: function(f) {
    return this.each(function(pair) {return f(pair.value);});
  },

  eachKey: function(f) {
    return this.each(function(pair) {return f(pair.key);});
  },

  mapToNewHash: function(f) {
    var h = new this.constructor();
    this.each(function(pair) {h.put(pair.key, f(pair.key, pair.value));});
    return h;
  },
};

Object.extend(   Hash.prototype, CommonHashTableStuff);
Object.extend(HashMap.prototype, CommonHashTableStuff);
Object.extend(HashMap.prototype, Enumerable);

function testHashTableStuff() {
  var h = new Hashtable();
  var k1 = new Object();
  var k2 = new Object();
  var k3 = pt(5, 6);
  h.put(k1, "One");
  h.put(k2, 2);
  h.put(k3, "the point (5, 6)");
  h.eachKeyAndValue(function(k, v) {
    console.log("Key: " + k + ", value: " + v);
  });
  console.log(h.get(k1));
  console.log(h.get(k2));
  console.log(h.get(k3));
}


// testHashTableStuff();
