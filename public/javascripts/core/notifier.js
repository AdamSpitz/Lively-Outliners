Object.subclass("Notifier", {
  initialize: function(s) {
    this.subject = s;
    this.observers = [];
    this.notification_batcher_upper = new BatcherUpper(this.notify_all_observers.bind(this));
  },

  add_observer: function(o) { this.observers.push(o); },

  notify_all_observers: function(arg) {
    if (this.notification_batcher_upper.should_not_bother_yet()) { return; }
    var s = this.subject;
    this.observers.each(function(o) {o(s, arg);});
  },

  dont_bother_notifying_until_the_end_of: function(f) {
    this.notification_batcher_upper.dont_bother_until_the_end_of(f);
  },

  add_all_observers_to: function(other_notifier) {
    this.observers.each(function(o) {other_notifier.add_observer(o);});
  },
});
