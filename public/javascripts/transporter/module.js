lobby.modules = {};

Object.subclass("Module", {
  initialize: function(n) {
    if (lobby.modules[n]) { throw "There is already a module named " + n; }
    this._name = n;
    lobby.modules[n] = this;
  },

  name: function() { return this._name; },

  toString: function() { return "the " + this.name() + " module"; },

  slotsInOrderForFilingOut: function(f) {
    var alreadySeen = new BloodyHashTable(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
    Transporter.objectsThatMightContainSlotsInModule(this).each(function(mir) {
      if (! alreadySeen.containsKey(mir)) {
        alreadySeen.put(mir, mir);
      }
    }.bind(this));
    var mirs = alreadySeen.values().sort(function(a, b) { return spaceship(a.name(), b.name()); });
    var slots = [];
    mirs.each(function(mir) {
      if (! mir.creatorSlotChain()) {
        throw "Cannot file out slots in a non-well-known mirror.";
      } else {
        mir.eachSlot(function(s) {
          if (s.module && s.module() === this) { slots.push(s); }
        }.bind(this));
      }
    }.bind(this));
    return slots;
  },

  fileOut: function() {
    var buffer = new StringBuffer();

    buffer.append("if (lobby.modules.").append(this.name()).append(") { throw 'The ").append(this.name()).append(" module is already loaded.'; }\n");
    buffer.append("var thisModule = new Module('").append(this.name()).append("');\n\n"); // aaa - a hack, but it'll do for now

    this.slotsInOrderForFilingOut().each(function(s) {
      console.log("Filing out " + s.holder().name() + " " + s.name());
      s.fileOutTo(buffer);
    }.bind(this));

    var url = Module.urlForModuleName(this.name());
    var doc = buffer.toString();
    var status = new Resource(Record.newPlainInstance({URL: url})).store(doc, true).getStatus();
    if (! status.isSuccess()) {
      throw "failed to file out " + this + ", status is " + status.code();
    }
  },

  loadSlot: function(holder, name, contents, options) {
    holder[name] = contents;

    var slot = new Mirror(holder).slotAt(name);

    slot.setModule(this);

    if (options) {
      if (options.isCreatorSlot) {
        slot.beCreator();
      }
    }
  },
});

Object.extend(Module, {
  urlForModuleName: function(name) {
    return new URL("http://localhost/~adam/uploads/" + name + ".js");
  },

  fileIn: function(name) {
    var url = this.urlForModuleName(name);
    var code = FileDirectory.getContent(url);
    eval(code);
  },
});
