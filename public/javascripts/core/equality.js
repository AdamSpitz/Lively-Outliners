// Maybe I'm missing it, but I haven't been able to find a general-purpose Javascript "equals" function. -- Adam, Jan. 2009


function areEqual(x1, x2) {
  if (x1 == null) {return x2 == null;}
  if (x2 == null) {return false;     }
  var t1 = typeof(x1);
  var t2 = typeof(x2);
  if (t1 != t2) {return false;}
  return x1.equals(x2);
}

function hashCodeOf(x) {
  if (x == null) {return '';}
  return x.hashCode();
}


Object.extend(Array.prototype, {
  equals: function(o) {
    if (typeof(this) != typeof(o)) {return false;}
    if (this.length != o.length) {return false;}
    for (var i = 0; i < this.length; ++i) {
      if (! areEqual(this[i], o[i])) {return false;}
    }
    return true;
  },

  hashCode: function() {
    return "array";
  },
});


Object.extend(String.prototype, {
  hashCode: function() {return this;},
});

Object.extend(Number.prototype, {
  hashCode: function() {return this;},
});
