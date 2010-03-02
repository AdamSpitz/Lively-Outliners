lobby.transporter.module.create('notifier', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('notifier', {}, {category: ['core']}, {comment: 'Keeps track of a list of observers and notifies them when requested.'});

});


thisModule.addSlots(lobby.notifier, function(add) {

  add.method('initialize', function (s) {
    this.subject = s;
    this.observers = [];
  }, {}, {});

  add.method('add_observer', function (o) {
    this.observers.push(o);
  }, {}, {});

  add.method('notify_all_observers', function (arg) {
    var s = this.subject;
    this.observers.each(function(o) {o(s, arg);});
  }, {}, {});

  add.method('add_all_observers_to', function (other_notifier) {
    this.observers.each(function(o) {other_notifier.add_observer(o);});
  }, {}, {});

});


});