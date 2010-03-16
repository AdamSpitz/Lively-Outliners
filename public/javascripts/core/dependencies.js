lobby.transporter.module.create('dependencies', function(thisModule) {


thisModule.addSlots(modules.dependencies, function(add) {
    
    add.data('_directory', 'core');

});


thisModule.addSlots(lobby, function(add) {

  add.creator('dependencies', {}, {category: ['collections']});

});


thisModule.addSlots(lobby.dependencies, function(add) {

  add.method('copyRemoveAll', function () {
    return Object.newChildOf(this);
  }, {category: ['creating']});

  add.method('initialize', function () {
    this._dependeesByDepender = dictionary.copyRemoveAll();
  }, {category: ['creating']});

  add.method('dependeesByDepender', function (o) {
    return this._dependeesByDepender;
  }, {category: ['accessing']});
  
  add.method('dependeesOf', function (o) {
    return this.dependeesByDepender().getOrIfAbsentPut(o, function() { return set.copyRemoveAll(); });
  }, {category: ['accessing']});

});


});
