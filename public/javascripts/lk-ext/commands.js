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
    return Object.newChildOf(this, cs);
  });

  add.method('initialize', function(cs) {
    this._commands = cs || [];
  });

  add.method('eachCommand', function(f) {
    this._commands.each(function(c) { if (c) { f(c); } });
  });

  add.method('addItem', function(c) {
    // for compatibility with MenuMorph
    if (reflect(c).isReflecteeArray()) {
      c = {label: c[0], go: c[1]};
    }

    this._commands.push(c);
  });

  add.method('addLine', function(c) {
    if (this._commands.length === 0 || this._commands[this._commands.length - 1] === null) { return; }
    this._commands.push(null);
  });

  add.method('addSection', function(cs) {
    if (cs.size() > 0) {
      this.addLine();
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


thisModule.addSlots(SelectionMorph.prototype, function(add) {
    
  add.method('inspect', function() {
    if (!this.selectedMorphs || this.selectedMorphs.length === 0) { return "nothing here"; }
    
    var morphsByClass = dictionary.copyRemoveAll();
    this.selectedMorphs.each(function(m) {
      morphsByClass.getOrIfAbsentPut(m.constructor, function() {return [];}).push(m);
    });

    var buf = stringBuffer.create();
    var sep = "";
    morphsByClass.eachKeyAndValue(function(c, ms) {
      buf.append(sep).append(ms.length.toString()).append(" ").append(reflect ? reflect(c).name() : c.type).append(ms.length === 1 ? "" : "s");
      sep = ", ";
    });
    return buf.toString();
  });

  add.method('addCommandsTo', function(cmdList) {
    if (! this.selectedMorphs) { return; }

    var morphsByCommandType = dictionary.copyRemoveAll();
    this.selectedMorphs.each(function(m) {
      var cmdList = m.commands();
      if (cmdList) {
        cmdList.eachCommand(function(c) {
          if (c.pluralLabel) {
            morphsByCommandType.getOrIfAbsentPut(c.pluralLabel, function() {return [];}).push([m, c]);
          }
        });
      }
    });

    morphsByCommandType.keys().sort().each(function(pluralLabel) {
      var morphsAndCommands = morphsByCommandType.get(pluralLabel);
      cmdList.addItem({label: pluralLabel, go: function(evt) {
        morphsAndCommands.each(function(morphAndCommand) {
          var command = morphAndCommand[1];
          command.go(evt);
        });
      }});
    });
  }, {category: ['menu']});

});



});
