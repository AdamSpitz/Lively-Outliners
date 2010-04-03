lobby.transporter.module.create('transporter/transporter', function(requires) {}, function(thisModule) {


thisModule.addSlots(transporter.module, function(add) {

  add.method('name', function () { return this._name; }, {category: ['accessing']});

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
              var slotsToOmit = annotator.adjustSlotsToOmit(cdp.slotsToOmit);
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

  add.creator('abstractFilerOuter', {}, {category: ['transporting']});

  add.creator('filerOuter', Object.create(transporter.module.abstractFilerOuter), {category: ['transporting']});

  add.creator('annotationlessFilerOuter', Object.create(transporter.module.abstractFilerOuter), {category: ['transporting']});

  add.method('codeToFileOut', function (filerOuter) {
    filerOuter.writeModule(this.name(), this._requirements, function() {
      this.eachSlotInOrderForFilingOut(function(s) {
        filerOuter.nextSlotIsIn(s.holder());
        s.fileOutWith(filerOuter);
      }.bind(this));
      filerOuter.doneWithThisObject();
    }.bind(this));

    return filerOuter.fullText();
  }, {category: ['transporting']});

  add.method('fileOutWithoutAnnotations', function () {
    return this.fileOut(Object.newChildOf(this.annotationlessFilerOuter));
  }, {category: ['transporting']});

  add.method('fileOut', function (filerOuter) {
    var codeToFileOut = this.codeToFileOut(filerOuter || Object.newChildOf(this.filerOuter)).toString();
    transporter.fileOut(this, codeToFileOut, function() {this.markAsUnchanged();}.bind(this));
  }, {category: ['transporting']});

  add.creator('slotOrderizer', {}, {category: ['transporting']});

  add.method('eachSlotInOrderForFilingOut', function (f) {
    Object.newChildOf(this.slotOrderizer, this).determineOrder().each(f);
  }, {category: ['transporting']});

  add.method('eachModule', function (f) {
    reflect(lobby.modules).eachNormalSlot(function(s) { f(s.contents().reflectee()); });
  }, {category: ['iterating']});

  add.method('changedOnes', function () {
    return Object.newChildOf(enumerator, this, 'eachModule').select(function(m) { return m.hasChangedSinceLastFileOut(); });
  }, {category: ['keeping track of changes']});

});


thisModule.addSlots(transporter.module.abstractFilerOuter, function(add) {

  add.method('initialize', function () {
    this._buffer = stringBuffer.create();
    this._previousHolder = null;
  }, {category: ['creating']});
    
  add.method('fullText', function () {
    return this._buffer.toString();
  }, {category: ['accessing']});

  add.method('nextSlotIsIn', function (holder) {
    if (!this._previousHolder || ! holder.equals(this._previousHolder)) {
      this.doneWithThisObject();
      this.writeObjectStarter(holder);
      this._previousHolder = holder;
    }
  }, {category: ['writing']});

  add.method('doneWithThisObject', function () {
    if (this._previousHolder) {
      this.writeObjectEnder(this._previousHolder);
      this._previousHolder = null;
    }
  }, {category: ['writing']});

});


thisModule.addSlots(transporter.module.filerOuter, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    this._buffer.append("transporter.module.create(").append(name.inspect()).append(", function(requires) {");
    
    if (reqs && reqs.length > 0) {
      this._buffer.append("\n\n");
      reqs.each(function(req) {
        this._buffer.append("requires(").append(req.inspect()).append(");\n");
      }.bind(this));
      this._buffer.append("\n");
    }

    this._buffer.append("}, function(thisModule) {\n\n\n");

    bodyBlock();

    this._buffer.append("});\n");
  }, {category: ['writing']});

  add.method('writeObjectStarter', function (mir) {
    this._buffer.append("thisModule.addSlots(").append(mir.creatorSlotChainExpression()).append(", function(add) {\n\n");
  }, {category: ['writing']});

  add.method('writeObjectEnder', function (mir) {
    this._buffer.append("});\n\n\n");
  }, {category: ['writing']});

  add.method('writeSlot', function (creationMethod, slotName, contentsExpr, optionalArgs) {
    this._buffer.append("  add.").append(creationMethod).append("('").append(slotName).append("', ").append(contentsExpr);
    this._buffer.append(optionalArgs);
    this._buffer.append(");\n\n");
  }, {category: ['writing']});

});


thisModule.addSlots(transporter.module.annotationlessFilerOuter, function(add) {

  add.method('writeModule', function (name, reqs, bodyBlock) {
    this._buffer.append("modules[").append(name.inspect()).append("] = {};\n\n");
    bodyBlock();
  }, {category: ['writing']});

  add.method('writeObjectStarter', function (mir) {
    this._buffer.append("Object.extend(").append(mir.creatorSlotChainExpression()).append(", {\n\n");
  }, {category: ['writing']});

  add.method('writeObjectEnder', function (mir) {
    this._buffer.append("});\n\n\n");
  }, {category: ['writing']});

  add.method('writeSlot', function (creationMethod, slotName, contentsExpr, optionalArgs) {
    this._buffer.append("  ").append(slotName).append(": ").append(contentsExpr);
    this._buffer.append(",\n\n");
  }, {category: ['writing']});

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
