lobby.transporter.module.create('applications', function(thisModule) {


thisModule.addSlots(modules.applications, function(add) {
    
    add.data('_directory', 'lk-ext');

});


thisModule.addSlots(WorldMorph.prototype, function(add) {

  add.method('inspect', function($super) {
    if (this._application) { return this._application.worldName(); }
    return $super();
  }, {category: ['applications']});

  add.method('commands', function($super) {
    if (! this._application) { return null; }
    var cmdList = command.list.create();
    this._application.addCommandsTo(cmdList);
    return cmdList;
  }, {category: ['applications']});
});


});
