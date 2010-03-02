lobby.transporter.module.create('mirrors', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('mirror', {});

  add.creator('slots', {});

});


thisModule.addSlots(lobby.mirror, function(add) {

  add.method('initialize', function (o) {
    this._reflectee = o;
  });

  add.method('reflectee', function () { return this._reflectee; });

  add.method('equals', function (m) {
    return this.reflectee() === m.reflectee();
  });

  add.method('hashCode', function () {
    return "a mirror"; // aaa - crap, hash tables will be linear time now; can I get an object ID somehow?;
  });

  add.method('reflecteeToString', function () {
    try {
      if (this.isReflecteePrimitive()) { return "" + this.reflectee(); }

      // Ignore the default toString because it just says [object Object] all the time and it's annoying.
      if (this.reflectee().toString === Object.prototype.toString) { return ""; } 
      
      return this.reflectee().toString();
    } catch (ex) {
      return "";
    }
  });

  add.method('toString', function () {
    return "on " + this.name();
  });

  add.method('inspect', function () {
    if (this.reflectee() === lobby) {return "lobby";}
    if (this.isReflecteePrimitive()) {return Object.inspect(this.reflectee());}
    if (this.isReflecteeArray()) { return this.reflectee().length > 5 ? "an array" : "[" + this.reflectee().map(function(elem) {return reflect(elem).inspect();}).join(", ") + "]"; }
    var n = this.name();
    if (this.isReflecteeFunction()) { return n; } // the code will be visible through the *code* fake-slot
    var s = new StringBuffer(n);
    var toString = this.reflecteeToString();
    if (typeof toString === 'string' && toString) { s.append("(").append(toString).append(")"); }
    return s.toString();
  });

  add.method('name', function () {
    if (this.isReflecteePrimitive()) {return "" + this.reflectee();}

    var chain = this.creatorSlotChain();
    if (chain) {
      if (chain.length === 0) {return "";}
      var isThePrototype = chain[0].contents().equals(this);
      var s = new StringBuffer(isThePrototype ? "" : chain[chain.length - 1].name().startsWithVowel() ? "an " : "a ");
      for (var i = chain.length - 1; i >= 0; i -= 1) {
        s.append(chain[i].name());
        if (i > 0) {s.append(" ");}
      }
      return s.toString();
    } else {
      return this.isReflecteeFunction() ? "a function" : this.isReflecteeArray() ? "an array" : "an object";
    }
  });

  add.method('creatorSlotChainExpression', function () {
    if (this.isReflecteePrimitive()) {throw this.reflectee() + " does not have a creator slot chain.";}

    var chain = this.creatorSlotChain();
    if (! chain) {throw this.reflectee() + " does not have a creator slot chain.";}

    var s = new StringBuffer("lobby");
    for (var i = chain.length - 1; i >= 0; i -= 1) {
      s.append(".").append(chain[i].name());
    }
    return s.toString();
  });

  add.method('creatorSlotChain', function () {
    if (this.isReflecteePrimitive()) {return null;}

    var chain = [];
    var lobbyMir = reflect(lobby);
    var mir = this;
    var cs;

    while (true) {
      if (mir.equals(lobbyMir)) { return chain; }
      cs = mir.creatorSlot();
      if (! cs) { return null; }
      chain.push(cs);
      mir = cs.holder();
    }
  });

  add.method('eachSlot', function (f) {
    this.eachFakeSlot(f);
    this.eachNormalSlot(f);
  });

  add.method('eachFakeSlot', function (f) {
    if (this.isReflecteeFunction()) { f(Object.create(lobby.slots.functionBody).initialize(this)); }
    if (this.hasAccessibleParent()) { f(Object.create(lobby.slots.parent      ).initialize(this)); }
  });

  add.method('eachNormalSlot', function (f) {
    if (! this.canHaveSlots()) {return;} // aaa - Do primitives have a parent? Or maybe numbers do but null doesn't or something?
    var o = this.reflectee();
    for (var name in o) {
      if (o.hasOwnProperty(name)) {
        if (name !== '__annotation__') { // shh! pretend it's not there.
          f(this.slotAt(name));
        }
      }
    }
  });

  add.method('eachSlotInCategory', function (c, f) {
    this.eachNormalSlot(function(s) {
      if (categoriesAreEqual(c, s.category())) { f(s); }
    });
  });

  add.method('eachImmediateSubcategoryOf', function (c, f) {
    var subcats = {};
    this.eachNormalSlot(function(s) {
      var sc = s.category();
      if (isImmediateSubcategoryOf(c, sc)) { subcats[categoryLastPartName(sc)] = sc; }
    });

    for (var name in subcats) {
      if (subcats.hasOwnProperty(name)) {
        f(subcats[name]);
      }
    }
  });

  add.method('slotAt', function (n) {
    return Object.create(lobby.slots.plain).initialize(this, n);
  });

  add.method('contentsAt', function (n) {
    return reflect(this.primitiveContentsAt(n));
  });

  add.method('primitiveContentsAt', function (n) {
    return this.reflectee()[n];
  });

  add.method('setContentsAt', function (n, m) {
    this.primitiveSetContentsAt(n, m.reflectee());
  });

  add.method('primitiveSetContentsAt', function (n, o) {
    return this.reflectee()[n] = o;
  });

  add.method('removeSlotAt', function (n) {
    delete this.reflectee()[n];
  });

  add.method('findUnusedSlotName', function (prefix) {
    if (! this.canHaveSlots()) { throw this.name() + " cannot have slots"; }
    var pre = prefix || "slot";
    var i = 0;
    var name;
    do {
      i += 1;
      name = pre + i;
    } while (this.reflectee().hasOwnProperty(name));
    return name;
  });

  add.method('reflecteeHasOwnProperty', function (n) {
    if (! this.canHaveSlots()) { return false; }
    return this.reflectee().hasOwnProperty(name);
  });

  add.method('parent', function () {
    if (! this.canAccessParent()) { throw "Sorry, you can't access an object's parent in this browser. Try Firefox or Safari."; }
    if (! this.hasParent()) { throw this.name() + " does not have a parent."; }
    return reflect(this.reflectee().__proto__);
  });

  add.method('canAccessParent', function () { return UserAgent.is_proto_property_supported; });

  add.method('hasParent', function () { return ! (this.isReflecteeNull() || this.isReflecteeUndefined()); });

  add.method('hasAccessibleParent', function () { return this.canAccessParent() && this.hasParent(); });

  add.method('setParent', function (pMir) {
    if (! this.canAccessParent()) { throw "Sorry, you can't change an object's parent in this browser. Try Firefox or Safari."; }
    this.reflectee().__proto__ = pMir.reflectee();
  });

  add.method('createChild', function () {
    var parent = this.reflectee();
    var ChildConstructor = UserAgent.is_proto_property_supported ? function() {} : function() {this.__parent_slot_that_does_not_actually_mean_anything_but_is_here_for_reflective_purposes__ = parent;};
    ChildConstructor.prototype = parent;
    var child = new ChildConstructor();
    return reflect(child);
  });

  add.method('source', function () {
    if (! this.isReflecteeFunction()) { throw "not a function"; }
    return this.reflectee().toString();
  });

  add.method('expressionEvaluatingToMe', function () {
    if (this.isReflecteePrimitive()) { return Object.inspect(this.reflectee()); }
    if (this.isReflecteeFunction()) { return this.source(); }
    if (this.isReflecteeArray()) { return "[" + this.reflectee().map(function(elem) {return reflect(elem).expressionEvaluatingToMe();}).join(", ") + "]"; }

    var str = new StringBuffer("{");
    var sep = "";
    this.eachNormalSlot(function(slot) {
        str.append(sep).append(slot.name()).append(": ").append(slot.contents().expressionEvaluatingToMe());
        sep = ", ";
    });
    str.append("}");
    return str.toString();

    // aaa - try something like Self's 1 _AsObject, except of course in JS it'll have to be a hack
    //throw "Not implemented yet - don't know how to make an expression evaluating to this object: " + this.name();
  });

  add.method('size', function () {
    var size = 0;
    this.eachNormalSlot(function(s) { size += 1; });
    return size;
  });

  add.method('canHaveSlots', function () {
    return ! this.isReflecteePrimitive();
  });

  add.method('canHaveChildren', function () {
    return ! this.isReflecteePrimitive(); // aaa - is this correct?;
  });

  add.method('isReflecteeNull', function () { return this.reflectee() === null;      });

  add.method('isReflecteeUndefined', function () { return this.reflectee() === undefined; });

  add.method('isReflecteeString', function () { return typeof this.reflectee() === 'string';  });

  add.method('isReflecteeNumber', function () { return typeof this.reflectee() === 'number';  });

  add.method('isReflecteeBoolean', function () { return typeof this.reflectee() === 'boolean'; });

  add.method('isReflecteeArray', function () { return typeof this.reflectee() === 'object' && this.reflectee() instanceof Array; });

  add.method('isReflecteePrimitive', function () { return ! (this.isReflecteeObject() || this.isReflecteeFunction()); });

  add.method('isReflecteeObject', function () {
    var o = this.reflectee();
    var t = typeof o;
    return t === 'object' && o !== null;
  });

  add.method('isReflecteeFunction', function () {
    return typeof(this.reflectee()) === 'function';
  });

  add.method('canHaveCreatorSlot', function () {
    // aaa - is this right?
    return this.isReflecteeObject() || this.isReflecteeFunction();
  });

  add.method('creatorSlot', function () {
    var a = this.annotation();
    if (! a) { return null; }
    if (a.hasOwnProperty('creatorSlotHolder') && a.hasOwnProperty('creatorSlotName')) {
      // could cache it if it's slow to keep recreating the Mirror and Slot objects.
      return reflect(a.creatorSlotHolder).slotAt(a.creatorSlotName);
    } else {
      return null;
    }
  });

  add.method('setCreatorSlot', function (s) {
    var a = this.annotationForWriting();
    a.creatorSlotName   = s.name();
    a.creatorSlotHolder = s.holder().reflectee();
  });

  add.method('comment', function () {
    var a = this.annotation();
    if (! a) { return ""; }
    return a.comment || "";
  });

  add.method('setComment', function (c) {
    this.annotationForWriting().comment = c || "";
  });

  add.method('canHaveAnnotation', function () {
    return this.isReflecteeObject() || this.isReflecteeFunction();
  });

  add.method('hasAnnotation', function () {
    return this.canHaveAnnotation() && this.reflectee().hasOwnProperty("__annotation__");
  });

  add.method('annotation', function () {
    if (! this.canHaveAnnotation()) { return null; }
    return this.reflectee().__annotation__;
  });

  add.method('annotationForWriting', function () {
    if (! this.hasAnnotation()) {
      if (! this.canHaveAnnotation()) { throw this.name() + " cannot have an annotation"; }
      return this.reflectee().__annotation__ = {slotAnnotations: {}};
    }
    return this.reflectee().__annotation__;
  });

  add.method('wellKnownChildren', function() {
    return new ChildFinder(this.reflectee()).go();
  });

  add.method('wellKnownReferences', function() {
    return new ReferenceFinder(this.reflectee()).go();
  });

});


thisModule.addSlots(lobby.slots, function(add) {

  add.creator('abstract', {});

  add.creator('plain', Object.create(lobby.slots.abstract));

  add.creator('parent', Object.create(lobby.slots.abstract));

  add.creator('functionBody', Object.create(lobby.slots.abstract));

});


thisModule.addSlots(lobby.slots.abstract, function(add) {

  add.method('initialize', function (m) {
    this._mirror = m;
    return this;
  });

  add.method('mirror', function () { return this._mirror; });

  add.method('holder', function () { return this._mirror; });

  add.method('isFunctionBody', function () { return false; });

});


thisModule.addSlots(lobby.slots.parent, function(add) {

  add.method('name', function () { return "*parent*"; });

  add.method('contents', function () { return this._mirror.parent(); });

  add.method('setContents', function (m) { return this._mirror.setParent(m); });

  add.method('isMethod', function () { return false; });

});


thisModule.addSlots(lobby.slots.functionBody, function(add) {

  add.method('name', function () { return "*body*"; });

  add.method('contents', function () { return this._mirror; });

  add.method('isMethod', function () { return true; });

  add.method('isFunctionBody', function () { return true; });

});


thisModule.addSlots(lobby.slots.plain, function(add) {

  add.method('initialize', function (m, n) {
    this._mirror = m;
    this._name = n;
    return this;
  });

  add.method('name', function () { return this._name; });

  add.method('contents', function () { return this._mirror.   contentsAt(this.name()   ); });

  add.method('setContents', function (m) { return this._mirror.setContentsAt(this.name(), m); });

  add.method('equals', function (s) {
    return this.name() === s.name() && this.mirror().equals(s.mirror());
  });

  add.method('toString', function () {
    if (this.name() === undefined) { return ""; }
    return this.name() + " slot";
  });

  add.method('copyTo', function (newMir) {
    newMir.setContentsAt(this.name(), this.contents());
    return newMir.slotAt(this.name());
  });

  add.method('remove', function () {
    this.mirror().removeSlotAt(this.name());
  });

  add.method('isMethod', function () {
    return this.contents().isReflecteeFunction();
  });

  add.method('rename', function (newName) {
    var oldName = this.name();
    if (oldName === newName) {return;}
    var contentsMir = this.contents();
    var o = this.holder().reflectee();
    if (  o.hasOwnProperty(newName)) { throw o + " already has a slot named " + newName; }
    if (! o.hasOwnProperty(oldName)) { throw o + " has no slot named "        + oldName; }

    var cs = contentsMir.creatorSlot();
    var isCreator = cs && cs.equals(this);

    var contents = o[oldName];
    delete o[oldName];
    o[newName] = contents;
    
    var newSlot = this.holder().slotAt(newName);
    var holderAnno = this.holder().annotationForWriting();
    holderAnno.slotAnnotations[newName] = holderAnno.slotAnnotations[oldName];
    delete holderAnno.slotAnnotations[oldName];

    if (isCreator) {newSlot.beCreator();}

    return newSlot;
  });

  add.method('hasAnnotation', function () {
    return this.holder().hasAnnotation() && this.holder().annotation().slotAnnotations[this.name()];
  });

  add.method('annotation', function () {
    var oa = this.holder().annotationForWriting();
    var sa = oa.slotAnnotations[this.name()];
    if (sa) {return sa;}
    return oa.slotAnnotations[this.name()] = {};
  });

  add.method('beCreator', function () {
    this.contents().setCreatorSlot(this);
  });

  add.method('module', function () {
    var a = this.annotation();
    if (! a) { return null; }
    return a.module;
  });

  add.method('setModule', function (m) {
    this.annotation().module = m;
    m.objectsThatMightContainSlotsInMe().push(this.holder().reflectee()); // aaa - there'll be a lot of duplicates; fix the performance later;
  });

  add.method('comment', function () {
    var a = this.annotation();
    if (! a) { return ""; }
    return a.comment || "";
  });

  add.method('setComment', function (c) {
    this.annotation().comment = c || "";
  });

  add.method('category', function () {
    var a = this.annotation();
    if (! a) { return rootCategory(); }
    return a.category || rootCategory();
  });

  add.method('setCategory', function (c) {
    this.annotation().category = c;
  });


  add.method('fileOutTo', function (buffer) {
    var creationMethod = "data";
    var contentsExpr;
    var contents = this.contents();
    var array = null;
    var isCreator = false;
    if (contents.isReflecteePrimitive()) {
      contentsExpr = "" + contents.reflectee();
    } else {
      var cs = contents.creatorSlot();
      if (! cs) {
        throw "Cannot file out a reference to " + contents.name();
      } else if (! cs.equals(this)) {
        // This is just a reference to some well-known object that's created elsewhere.
        contentsExpr = contents.creatorSlotChainExpression();
      } else {
        var isCreator = true;
        if (contents.isReflecteeFunction()) {
          creationMethod = "method";
          contentsExpr = contents.reflectee().toString();
        } else {
          creationMethod = "creator";
          if (contents.isReflecteeArray()) {
            contentsExpr = "[]";
            array = contents.reflectee();
          } else {
            var contentsParent = contents.parent();
            if (contentsParent.equals(reflect(Object.prototype))) {
              contentsExpr = "{}";
            } else {
              contentsExpr = "Object.create(" + contentsParent.creatorSlotChainExpression() + ")";
            }
          }
        }
      }
    }

    var slotAnnoToStringify = {};
    var slotAnno = this.annotation();
    if (slotAnno.comment ) {slotAnnoToStringify.comment  = slotAnno.comment;}
    if (slotAnno.category) {slotAnnoToStringify.category = slotAnno.category;}

    buffer.append("  add.").append(creationMethod).append("('").append(this.name()).append("', ").append(contentsExpr);
    buffer.append(", ").append(reflect(slotAnnoToStringify).expressionEvaluatingToMe());

    if (isCreator) {
      var objectAnnoToStringify = {};
      var objectAnno = contents.annotation();
      if (objectAnno) {
        if (objectAnno.comment) {objectAnnoToStringify.comment = objectAnno.comment;}
        buffer.append(", ").append(reflect(objectAnnoToStringify).expressionEvaluatingToMe());
      }
    }

    buffer.append(");\n\n");

    if (array) {
      for (var i = 0, n = array.length; i < n; i += 1) {
        contents.slotAt(i.toString()).fileOutTo(buffer);
      }
    }
  });

  add.method('wellKnownImplementors', function() {
    return new ImplementorsFinder(this.name()).go();
  });

});


});
