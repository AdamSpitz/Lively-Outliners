lobby.transporter.module.create('transporter', function(thisModule) {


thisModule.addSlots(transporter.module, function(add) {

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('toString', function () { return this.name(); }, {category: ['printing']});

  add.method('objectsThatMightContainSlotsInMe', function () {
    return lobby.transporter.module.cache[this.name()];
  }, {category: ['keeping track of changes']});

  add.method('mirrorsInOrderForFilingOut', function (f) {
    var alreadySeen = bloodyHashTable.copyRemoveAll(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
    this.objectsThatMightContainSlotsInMe().each(function(obj) {
      var mir = reflect(obj);
      if (! alreadySeen.containsKey(mir)) {
        alreadySeen.put(mir, mir);
      }
    }.bind(this));
    return alreadySeen.values().sort(function(a, b) { var an = a.name(); var bn = b.name(); return an === bn ? 0 : an < bn ? -1 : 1; });
  }, {category: ['transporting']});

  add.method('fileOut', function () {
    var buffer = stringBuffer.create("lobby.transporter.module.create('").append(this.name()).append("', function(thisModule) {\n\n\n");
    this.fileOutSlots(buffer);
    buffer.append("});");

    var doc = buffer.toString();

    // aaa - hack because I haven't managed to get WebDAV working on adamspitz.com yet
    if (URL.source.hostname.include("adamspitz.com")) {
      var uploadScriptURL = "http://adamspitz.com/cgi-bin/savefile.cgi";
      new Ajax.Request(uploadScriptURL, {
        method: 'post',
        contentType: 'text/plain',
        parameters: {fileName: this.name() + ".js", fileContents: doc},
        asynchronous: true,
        onSuccess:   function(transport) { var urlToDownload = transport.responseText; window.open(urlToDownload, 'Download'); }.bind(this),
        onFailure:   function(         ) {alert("Failure. :(");}.bind(this),
        onException: function(r,      e) {alert("Exception. :(");}.bind(this),
      });
    } else {
      var url = this.urlForModuleName(this.name());
      var status = new Resource(Record.newPlainInstance({URL: url})).store(doc, true).getStatus();
      if (! status.isSuccess()) {
        throw "failed to file out " + this + ", status is " + status.code();
      }
    }
  }, {category: ['transporting']});

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
  }, {category: ['transporting']});

  add.method('urlForModuleDirectory', function () {
    return URL.source.getDirectory().withRelativePath("../jsdemo/");
  }, {category: ['saving to WebDAV']});

  add.method('urlForModuleName', function (name) {
    return this.urlForModuleDirectory().withFilename(name + ".js");
  }, {category: ['saving to WebDAV']});

  add.method('fileIn', function (name) {
    var url = this.urlForModuleName(name);
    var code = FileDirectory.getContent(url);
    eval(code);
    var module = this.existingOneNamed(name);
    if (module.postFileIn) { module.postFileIn(); }
    return module;
  }, {category: ['transporting']});

  add.method('eachModule', function (f) {
    reflect(lobby.modules).eachNormalSlot(function(s) { f(s.contents().reflectee()); });
  }, {category: ['iterating']});

  add.method('existingOneNamed', function (n) {
    return lobby.modules[n];
  }, {category: ['accessing modules']});

});

});
