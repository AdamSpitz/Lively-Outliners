lobby.transporter.module.create('transporter', function(thisModule) {


thisModule.addSlots(lobby.transporter.module, function(add) {

  add.method('name', function () { return this._name; });

  add.method('toString', function () { return this.name(); });

  add.method('objectsThatMightContainSlotsInMe', function () {
    return lobby.transporter.module.cache[this.name()];
  });

  add.method('mirrorsInOrderForFilingOut', function (f) {
    var alreadySeen = new BloodyHashTable(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
    this.objectsThatMightContainSlotsInMe().each(function(obj) {
      var mir = reflect(obj);
      if (! alreadySeen.containsKey(mir)) {
        alreadySeen.put(mir, mir);
      }
    }.bind(this));
    return alreadySeen.values().sort(function(a, b) { var an = a.name(); var bn = b.name(); return an === bn ? 0 : an < bn ? -1 : 1; });
  });

  add.method('fileOut', function () {
    var buffer = new StringBuffer("lobby.transporter.module.create('").append(this.name()).append("', function(thisModule) {\n\n\n");
    this.fileOutSlots(buffer);
    buffer.append("});");

    var url = this.urlForModuleName(this.name());
    var doc = buffer.toString();
    var status = new Resource(Record.newPlainInstance({URL: url})).store(doc, true).getStatus();
    if (! status.isSuccess()) {
      throw "failed to file out " + this + ", status is " + status.code();
    }
  });

  add.method('fileOutSlots', function (buffer) {
    var mirs = this.mirrorsInOrderForFilingOut();
    mirs.each(function(mir) {
      buffer.append("thisModule.addSlots(").append(mir.creatorSlotChainExpression()).append(", function(add) {\n\n");
      mir.eachSlot(function(s) {
        if (s.module && s.module() === this) {
          s.fileOutTo(buffer);
        }
      }.bind(this));
      buffer.append("});\n\n\n");
    }.bind(this));
  });

  add.method('urlForModuleDirectory', function () {
    return new URL("http://localhost/~adam/uploads/");
  });

  add.method('urlForModuleName', function (name) {
    return this.urlForModuleDirectory().withFilename(name + ".js");
  });

  add.method('fileIn', function (name) {
    var url = this.urlForModuleName(name);
    var code = FileDirectory.getContent(url);
    eval(code);
  });

  add.method('eachModule', function (f) {
    reflect(lobby.modules).eachNonParentSlot(function(s) { f(s.contents().reflectee()); });
  });

});


});
