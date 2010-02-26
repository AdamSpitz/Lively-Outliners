Object.extend(lobby.transporter.module, {
  name: function() { return this._name; },

  toString: function() { return "the " + this.name() + " module"; },

  objectsThatMightContainSlotsInMe: function() {
    return lobby.transporter.module.cache[this.name()];
  },

  slotsInOrderForFilingOut: function(f) {
    var alreadySeen = new BloodyHashTable(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
    this.objectsThatMightContainSlotsInMe().each(function(obj) {
      var mir = new Mirror(obj);
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
    var buffer = new StringBuffer("(function() {\n\n");
    buffer.append("if (lobby.modules.").append(this.name()).append(") { throw 'The ").append(this.name()).append(" module is already loaded.'; }\n");
    buffer.append("var thisModule = lobby.transporter.module.named('").append(this.name()).append("');\n\n");
    this.slotsInOrderForFilingOut().each(function(s) { s.fileOutTo(buffer); }.bind(this));
    buffer.append("\n})();");

    var url = this.urlForModuleName(this.name());
    var doc = buffer.toString();
    var status = new Resource(Record.newPlainInstance({URL: url})).store(doc, true).getStatus();
    if (! status.isSuccess()) {
      throw "failed to file out " + this + ", status is " + status.code();
    }
  },



  urlForModuleName: function(name) {
    return new URL("http://localhost/~adam/uploads/" + name + ".js");
  },

  fileIn: function(name) {
    var url = this.urlForModuleName(name);
    var code = FileDirectory.getContent(url);
    eval(code);
  },

  eachModule: function(f) {
    new Mirror(lobby.modules).eachNonParentSlot(function(s) { f(s.contents().reflectee()); });
  },
});
