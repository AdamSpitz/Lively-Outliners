lobby.transporter.module.create('lk_ext/applications', function(requires) {}, function(thisModule) {


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
