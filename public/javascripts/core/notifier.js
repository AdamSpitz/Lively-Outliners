Object.subclass("Notifier", {
  initialize: function(s) {
    this.subject = s;
    this.observers = [];
  },

  add_observer: function(o) {
    this.observers.push(o);
  },

  notify_all_observers: function(arg) {
    var s = this.subject;
    this.observers.each(function(o) {o(s, arg);});
  },

  add_all_observers_to: function(other_notifier) {
    this.observers.each(function(o) {other_notifier.add_observer(o);});
  },
});
