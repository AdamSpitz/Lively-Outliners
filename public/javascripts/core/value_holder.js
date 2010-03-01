Object.subclass("ValueHolder", {
  initialize: function(v) {
    this.notifier = new Notifier(this);
    this.setValue(v);
  },

  getValue: function( ) { return this.value; },

  setValue: function(v) {
    var oldValue = this.value;
    var changed = this.areValuesDifferent(oldValue, v);
    this.value = v;
    if (changed) {this.notifier.notify_all_observers();}
    return v;
  },

  areValuesDifferent: function(v1, v2) {
    return v1 != v2;
  },

  add_observer: function(o) {
      this.notifier.add_observer(o);
      return this;
  },
});

ValueHolder.subclass("BooleanHolder", {
  isChecked:  function( ) { return this.getValue();     },
  setChecked: function(b) { return this.setValue(b);    },
  areValuesDifferent: function(v1, v2) { return (!v1) !== (!v2); },
});
