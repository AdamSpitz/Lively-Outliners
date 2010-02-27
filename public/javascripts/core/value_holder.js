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
  areValuesDifferent: function(v1, v2) { return (!v1) != (!v2); },
});



ValueHolder.subclass("ArrayHolder", {
  addElement:        function(p) {                      this.value.push (p);                this.notifier.notify_all_observers(); },
  removeElement:     function(p) {                      this.value = this.value.without(p); this.notifier.notify_all_observers(); },
  removeAllElements: function( ) {var old = this.value; this.value = [];                    this.notifier.notify_all_observers(); return old; },

  // aaa - Not sure these compatibility methods really belong here, but let's try it.
  rejiggerTheLayout: function() {},
  dontBotherRejiggeringTheLayoutUntilTheEndOf: function(f) {f();},
});

ValueHolder.subclass("TextHolder", {
  getText: function( ) { return this.getValue();     },
  setText: function(t) { return this.setValue(t);    },
  getSavedText: function()  {return this.getText( );},
  setSavedText: function(t) {return this.setText(t);},
});
