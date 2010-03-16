lobby.transporter.module.create('transporter', function(thisModule) {


thisModule.addSlots(modules.transporter, function(add) {
    
    add.data('_directory', 'transporter');

});


thisModule.addSlots(transporter.module, function(add) {

  add.data('_directory', '', {category: ['accessing']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('directory', function () { return this._directory; }, {category: ['accessing']});

  add.method('setDirectory', function (d) { this._directory = d; }, {category: ['accessing']});

  add.method('toString', function () { return this.name(); }, {category: ['printing']});

  add.method('objectsThatMightContainSlotsInMe', function () {
    return lobby.transporter.module.cache[this.name()];
  }, {category: ['keeping track of changes']});

  add.method('hasChangedSinceLastFileOut', function () {
    return this._hasChangedSinceLastFileOut;
  }, {category: ['keeping track of changes']});

  add.method('markAsChanged', function () {
    this._hasChangedSinceLastFileOut = true;
  }, {category: ['keeping track of changes']});

  add.method('markAsUnchanged', function () {
    this._hasChangedSinceLastFileOut = false;
  }, {category: ['keeping track of changes']});

  add.method('mirrorsInOrderForFilingOut', function (f) {
    var alreadySeen = hashMap.copyRemoveAll(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
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
        onSuccess:   function(transport) { var urlToDownload = transport.responseText; window.open(urlToDownload, 'Download'); this.markAsUnchanged();  }.bind(this),
        onFailure:   function(         ) {alert("Failure. :(");}.bind(this),
        onException: function(r,      e) {alert("Exception. :(");}.bind(this),
      });
    } else {
      
      var baseDirURL = URL.source.getDirectory().withRelativePath("javascripts/");
      //new FileDirectory(baseDirURL.withRelativePath("javascripts/")).createDirectory(this.directory());
      var moduleDirURL = this.urlForModuleDirectory("non-core/" + this.directory());
      var url = moduleDirURL.withFilename(this.name() + ".js");
      var status = new Resource(Record.newPlainInstance({URL: url})).store(doc, true).getStatus();
      if (! status.isSuccess()) {
        throw "failed to file out " + this + ", status is " + status.code();
      }
      this.markAsUnchanged();
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

  add.method('urlForModuleDirectory', function (directory) {
    if (! directory) { directory = ""; }
    if (directory && directory[directory.length] !== '/') { directory += '/'; }
    var baseDirURL = URL.source.getDirectory().withRelativePath("javascripts/");
    return baseDirURL.withRelativePath(directory);
  }, {category: ['saving to WebDAV']});

  add.method('urlForCoreModulesDirectory', function () {
    return URL.source.getDirectory().withRelativePath("javascripts/fileouts/");
  }, {category: ['saving to WebDAV']});

  add.method('urlForNonCoreModulesDirectory', function () {
    return URL.source.getDirectory().withRelativePath("javascripts/non-core/");
  }, {category: ['saving to WebDAV']});

  add.method('urlForModuleName', function (name, directory) {
    var moduleDirURL = this.urlForModuleDirectory(directory);
    return moduleDirURL.withFilename(name + ".js");
  }, {category: ['saving to WebDAV']});

  add.method('fileIn', function (name) {
    var url = this.urlForModuleName(name, "non-core/");
    var code = FileDirectory.getContent(url);
    eval(code);
    var module = this.existingOneNamed(name);
    if (module) {
      if (module.postFileIn) { module.postFileIn(); }
      return module;
    } else {
      // Could just be some external Javascript library - doesn't have
      // to be one of our modules.
    }
  }, {category: ['transporting']});

  add.method('eachModule', function (f) {
    reflect(lobby.modules).eachNormalSlot(function(s) { f(s.contents().reflectee()); });
  }, {category: ['iterating']});

  add.method('existingOneNamed', function (n) {
    return lobby.modules[n];
  }, {category: ['accessing modules']});

  add.method('changedOnes', function () {
    return Object.newChildOf(enumerator, this, 'eachModule').select(function(m) { return m.hasChangedSinceLastFileOut(); });
  }, {category: ['keeping track of changes']});

});

});
