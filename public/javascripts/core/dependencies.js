lobby.transporter.module.create('dependencies', function(requires) {}, function(thisModule) {


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
    this._dependersByDependee = dictionary.copyRemoveAll();
  }, {category: ['creating']});

  add.method('dependeesByDepender', function () {
    return this._dependeesByDepender;
  }, {category: ['accessing']});

  add.method('dependersByDependee', function () {
    return this._dependersByDependee;
  }, {category: ['accessing']});
  
  add.method('dependeesOf', function (depender) {
    return this.dependeesByDepender().get(depender) || [];
  }, {category: ['accessing']});
  
  add.method('addDependency', function (depender, dependee) {
    if (depender.equals(dependee)) { return; }
    (this.dependeesByDepender().getOrIfAbsentPut(depender, function() { return set.copyRemoveAll(); })).add(dependee);
    (this.dependersByDependee().getOrIfAbsentPut(dependee, function() { return set.copyRemoveAll(); })).add(depender);
  }, {category: ['adding']});
  
  add.method('eachDependency', function (f) {
    this.dependeesByDepender().eachKeyAndValue(function(depender, dependees) {
      dependees.each(function(dependee) {
        f(depender, dependee);
      });
    });
  }, {category: ['iterating']});

  add.method('removeDependee', function (dependee) {
    var dependers = this.dependersByDependee().removeKey(dependee);
    if (! dependers) { return; }
    dependers.each(function(depender) { this.dependeesByDepender().get(depender).remove(dependee); }.bind(this));
  }, {category: ['removing']});
});


});
