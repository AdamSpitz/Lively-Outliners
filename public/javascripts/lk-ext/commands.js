lobby.transporter.module.create('commands', function(thisModule) {


thisModule.addSlots(modules.commands, function(add) {
    
    add.data('_directory', 'lk-ext');

});


thisModule.addSlots(lobby, function(add) {

  add.creator('command', {}, {category: ['ui']});

});


thisModule.addSlots(command, function(add) {

  add.creator('list', {});
  
});


thisModule.addSlots(command.list, function(add) {

  add.method('create', function(cs) {
    return Object.newChildOf(this, cs)
  });

  add.method('initialize', function(cs) {
    this._commands = cs || [];
  });

  add.method('commands', function(cs) {
    return this._commands;
  });

  add.method('addItem', function(c) {
    // for compatibility with MenuMorph
    if (reflect(c).isReflecteeArray()) {
      c = {label: c[0], go: c[1]};
    }

    this._commands.push(c);
  });

  add.method('addLine', function(c) {
    this._commands.push(null);
  });

  add.method('addSection', function(cs) {
    if (cs.size() > 0) {
      if (this._commands.size() > 0) {this.addLine();}
      cs.each(this.addItem.bind(this));
    }
  });

  add.method('addItemsToMenu', function(menu, morph) {
    this._commands.each(function(c) {
      if (c) {
        var label = typeof(c.label) === 'function' ? c.label(morph) : c.label;
        menu.addItem([label, function(evt) { c.go(evt); }]);
      } else {
        menu.addLine();
      }
    });
  });
  
});



});
