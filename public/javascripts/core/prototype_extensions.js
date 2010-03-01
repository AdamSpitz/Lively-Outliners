Object.extend(Array.prototype, {
  reverseEach: function(iterator) {
    for (var i = this.length - 1; i >= 0; --i) {
      iterator(this[i]);
    }
  },
});

Object.extend(Hash.prototype, {
  eachKey:   function(iterator) { this.each(function(pair) { iterator(pair.key  ); }); },
  eachValue: function(iterator) { this.each(function(pair) { iterator(pair.value); }); },
});

EnumerableExtensions = {
  join: function(separator) {
    var result = '';
    var sep = null;
    this.each(function (x) {
      result += x;
      if (sep != null) {result += sep;}
      sep = separator;
    });
    return result;
  },
};

Object.extend(Enumerable,      EnumerableExtensions);
// aaa: I don't know why this breaks stuff, but it does: Object.extend(Array.prototype, EnumerableExtensions);



Object.all_attributes = function(object) {
  var a = [];
  for (var name in object) {
    a.push(name);
  }
  return a;
};
