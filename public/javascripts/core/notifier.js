lobby.transporter.module.create('notifier', function(requires) {

requires('core', 'hash_table');

}, function(thisModule) {


thisModule.addSlots(modules.notifier, function(add) {
    
    add.data('_directory', 'core');

});


thisModule.addSlots(lobby, function(add) {

  add.creator('notifier', {}, {category: ['core']}, {comment: 'Keeps track of a list of observers and notifies them when requested.'});

});


thisModule.addSlots(lobby.notifier, function(add) {

  add.method('on', function (s) {
    return Object.newChildOf(this, s);
  });

  add.method('initialize', function (s) {
    this.subject = s;
    this.observers = Object.newChildOf(set, set.identityComparator);
  });

  add.method('add_observer', function (o) {
    this.observers.add(o);
  });

  add.method('remove_observer', function (o) {
    this.observers.remove(o);
  });

  add.method('notify_all_observers', function (arg) {
    var s = this.subject;
    this.observers.each(function(o) {o(s, arg);});
  });

  add.method('add_all_observers_to', function (other_notifier) {
    this.observers.each(function(o) {other_notifier.add_observer(o);});
  });

});


});
