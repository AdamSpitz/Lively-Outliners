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

  add.method('eachSlotInMirror', function (mir, f) {
    mir.eachNormalSlot(function(s) {
      if (s.module() === this) {
        f(s);
      }
    }.bind(this));
  }, {category: ['iterating']});

  add.method('slotDependencies', function () {
    var deps = dependencies.copyRemoveAll();
    
    var alreadySeen = set.copyRemoveAll(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
    this.objectsThatMightContainSlotsInMe().each(function(obj) {
      var mir = reflect(obj);
      if (! alreadySeen.includes(mir)) {
        alreadySeen.add(mir);

        this.eachSlotInMirror(mir, function(s) {
          var contents = s.contents();
          if (s.isCreator()) {
            
            var parent = contents.parent();
            var parentCreatorSlot = parent.creatorSlot();
            if (parentCreatorSlot && parentCreatorSlot.module() === this) {
              deps.addDependency(s, parentCreatorSlot);
            }
            
            var cdps = contents.copyDownParents();
            cdps.each(function(cdp) {
              var copyDownParent = reflect(cdp.parent);
              var slotsToOmit = adjustSlotsToOmit(cdp.slotsToOmit);
              var copyDownParentCreatorSlot = copyDownParent.creatorSlot();
              if (copyDownParentCreatorSlot && copyDownParentCreatorSlot.module() === this) {
                deps.addDependency(s, copyDownParentCreatorSlot);
              }

              // aaa - For now, make every slot in the copy-down parent exist before the child,
              // because we don't yet have a mechanism to update the copy-down children on
              // the fly as the copy-down parent changes.
              this.eachSlotInMirror(copyDownParent, function(slotInCopyDownParent) {
                if (! slotsToOmit.include(slotInCopyDownParent.name())) {
                  deps.addDependency(s, slotInCopyDownParent);
                }
              }.bind(this));

            }.bind(this));
              
            this.eachSlotInMirror(contents, function(slotInContents) {
              deps.addDependency(slotInContents, s);
            }.bind(this));
          } else if (! s.initializationExpression()) {
            var contentsCreatorSlot = contents.canHaveCreatorSlot() && contents.creatorSlot();
            if (contentsCreatorSlot && contentsCreatorSlot.module() === this) {
              deps.addDependency(s, contentsCreatorSlot);
            }
          }
        }.bind(this));
      }
    }.bind(this));
    
    return deps;
  }, {category: ['transporting'], comment: 'If Javascript could do "become", this would be unnecessary, since we could just put in a placeholder and then swap it for the real object later.'});

  add.method('mirrorsInOrderForFilingOut', function () {
    var allMirrors = set.copyRemoveAll(); // aaa - remember that mirrors don't hash well; this'll be slow for big modules unless we fix that
    this.objectsThatMightContainSlotsInMe().each(function(obj) { allMirrors.add(reflect(obj)); }.bind(this));
    return allMirrors.toArray().sort(function(a, b) { var an = a.name(); var bn = b.name(); return an === bn ? 0 : an < bn ? -1 : 1; });
  }, {category: ['transporting']});

  add.method('fileOut', function () {
    var buffer = stringBuffer.create("lobby.transporter.module.create('").append(this.name()).append("', function(thisModule) {\n\n\n");
    this.fileOutSlots(buffer);
    buffer.append("});");

    var doc = buffer.toString();

    // aaa - hack because I haven't managed to get WebDAV working on adamspitz.com yet
    if (URL.source.hostname.include("adamspitz.com")) {
      var uploadScriptURL = "http://adamspitz.com/cgi-bin/savefile.cgi";
      var req = new Ajax.Request(uploadScriptURL, {
        method: 'post',
        contentType: 'text/plain',
        parameters: {fileName: this.name() + ".js", fileContents: doc},
        asynchronous: true,
        onSuccess:   function(transport) { var urlToDownload = transport.responseText; window.open(urlToDownload); this.markAsUnchanged();  }.bind(this),
        onFailure:   function(         ) {alert("Failure. :(");}.bind(this),
        onException: function(r,      e) {alert("Exception. :(");}.bind(this)
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

  add.creator('slotOrderizer', {}, {category: ['transporting']});

  add.method('eachSlotInOrderForFilingOut', function (f) {
    Object.newChildOf(this.slotOrderizer, this).determineOrder().each(f);
  }, {category: ['transporting']});

  add.method('aaa_old_eachSlotInOrderForFilingOut', function (f) {
    this.mirrorsInOrderForFilingOut().each(function(mir) {
      this.eachSlotInMirror(mir, function(s) {
        f(s);
      });
    }.bind(this));
  }, {category: ['transporting']});

  add.method('fileOutSlots', function (buffer) {
    var previousHolder = null;
    
    this.eachSlotInOrderForFilingOut(function(s) {
      var holder = s.holder();
      if (!previousHolder || ! holder.equals(previousHolder)) {
        if (previousHolder) { buffer.append("});\n\n\n"); }
        buffer.append("thisModule.addSlots(").append(holder.creatorSlotChainExpression()).append(", function(add) {\n\n");
        previousHolder = holder;
      }
      s.fileOutTo(buffer);
    }.bind(this));

    buffer.append("});\n\n\n");
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


thisModule.addSlots(transporter.module.slotOrderizer, function(add) {

  add.method('initialize', function (m) {
    this._module = m;
    this._slotsInOrder = [];

    this._slotDeps = this._module.slotDependencies();

    this._remainingSlotsByMirror = dictionary.copyRemoveAll();
    this._module.objectsThatMightContainSlotsInMe().each(function(obj) {
      var mir = reflect(obj);
      var slots = set.copyRemoveAll();
      this._module.eachSlotInMirror(mir, function(s) { slots.add(s); }.bind(this));
      if (! slots.isEmpty()) {
        this._remainingSlotsByMirror.put(mir, slots);
      }
    }.bind(this));

    this.recalculateObjectDependencies();
  }, {category: ['creating']});

  add.method('recalculateObjectDependencies', function () {
    this._objDeps = dependencies.copyRemoveAll();
    this._slotDeps.eachDependency(function(depender, dependee) {
      this._objDeps.addDependency(depender.holder(), dependee.holder());
    }.bind(this));
  }, {category: ['dependencies']});

  add.method('chooseAMirrorWithNoDependees', function () {
    return exitValueOf(function(exit) {
      this._remainingSlotsByMirror.eachKeyAndValue(function(mir, slots) {
        if (slots.size() === 0) { throw "oops, we were supposed to remove the mirror from the dictionary if it had no slots left"; }
        if (this._objDeps.dependeesOf(mir).size() === 0) { exit(mir); }
      }.bind(this));
      return null;
    }.bind(this));
  }, {category: ['dependencies']});

  add.method('chooseASlotWithNoDependees', function (slots) {
    return slots.find(function(s) { return this._slotDeps.dependeesOf(s).size() === 0; }.bind(this));
  }, {category: ['dependencies']});

  add.method('determineOrder', function () {
    while (! this._remainingSlotsByMirror.isEmpty()) {
      var nextMirrorToFileOut = this.chooseAMirrorWithNoDependees();
      if (nextMirrorToFileOut) {
        this.nextObjectIs(nextMirrorToFileOut);
      } else {
        throw "there is a cycle in the object dependency graph; breaking the cycle is not implemented yet";
      }
    }
    return this._slotsInOrder;
  }, {category: ['transporting']});

  add.method('nextObjectIs', function (nextMirrorToFileOut) {
    var slots = this._remainingSlotsByMirror.get(nextMirrorToFileOut);
    while (! slots.isEmpty()) {
      var nextSlotToFileOut = this.chooseASlotWithNoDependees(slots);
      if (nextSlotToFileOut) {
        this.nextSlotIs(nextSlotToFileOut, false);
      } else {
        throw "there is a cycle in the slot dependency graph; breaking the cycle is not implemented yet";
      }
    }
    this._objDeps.removeDependee(nextMirrorToFileOut);
  }, {category: ['transporting']});

  add.method('nextSlotIs', function (s, shouldUpdateObjDeps) {
    this._slotsInOrder.push(s);
    var holder = s.holder();
    var slots = this._remainingSlotsByMirror.get(holder);
    slots.remove(s);
    if (slots.isEmpty()) { this._remainingSlotsByMirror.removeKey(holder); }
    this._slotDeps.removeDependee(s);
    if (shouldUpdateObjDeps) { this.recalculateObjectDependencies(); }
  }, {category: ['transporting']});
});



});
