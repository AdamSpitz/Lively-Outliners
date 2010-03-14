lobby.transporter.module.create('mirrors', function(thisModule) {


/*
thisModule.addSlots(modules.mirrors, function(add) {
    
    add.data('_directory', 'mirrors');

});
*/


thisModule.addSlots(lobby, function(add) {

  add.creator('mirror', {}, {category: ['mirrors']});

  add.creator('slots', {}, {category: ['mirrors']});

});


thisModule.addSlots(mirror, function(add) {

  add.method('initialize', function (o) {
    this._reflectee = o;
  }, {category: ['initializing']});

  add.method('reflectee', function () { return this._reflectee; }, {category: ['accessing reflectee']});

  add.method('equals', function (m) {
    return this.reflectee() === m.reflectee();
  }, {category: ['comparing']});

  add.method('hashCode', function () {
    return "a mirror"; // aaa - crap, hash tables will be linear time now; can I get an object ID hash somehow?;
  }, {category: ['comparing']});

  add.method('reflecteeToString', function () {
    try {
      if (this.isReflecteePrimitive()) { return "" + this.reflectee(); }

      // Ignore the default toString because it just says [object Object] all the time and it's annoying.
      if (this.reflectee().toString === Object.prototype.toString) { return ""; } 
      
      return this.reflectee().toString();
    } catch (ex) {
      return "";
    }
  }, {category: ['naming']});

  add.method('toString', function () {
    return "on " + this.name();
  }, {category: ['naming']});

  add.method('nameOfLobby', function () {
    // I haven't quite decided whether I want to call it lobby or Global or window or what.
    return lobby === Global ? "Global" : "lobby";
  }, {category: ['naming']});

  add.method('inspect', function () {
    if (this.reflectee() === lobby) {return this.nameOfLobby();}
    if (this.isReflecteePrimitive()) {return Object.inspect(this.reflectee());}
    if (this.isReflecteeArray()) { return this.reflectee().length > 5 ? "an array" : "[" + this.reflectee().map(function(elem) {return reflect(elem).inspect();}).join(", ") + "]"; }
    var n = this.name();
    if (this.isReflecteeFunction()) { return n; } // the code will be visible through the *code* fake-slot
    var s = stringBuffer.create(n);
    var toString = this.reflecteeToString();
    if (typeof toString === 'string' && toString) { s.append("(").append(toString).append(")"); }
    return s.toString();
  }, {category: ['naming']});

  add.method('name', function () {
    if (this.isReflecteePrimitive()) {return "" + this.reflectee();}

    var chain = this.creatorSlotChain();
    if (chain) {
      if (chain.length === 0) {return "";}
      var isThePrototype = chain[0].contents().equals(this);
      var s = stringBuffer.create(isThePrototype ? "" : chain[chain.length - 1].name().startsWithVowel() ? "an " : "a ");

      // HACK - Recognize class-like patterns and show names like "a WobulatorMorph" rather than "a WobulatorMorph.prototype",
      // because, well, that's really annoying. Not sure this is the right way to fix this. But the reality is that in JS code
      // it'll probably be common to have both class-like and prototype-like inheritance and naming patterns.
      var stopHere =  !isThePrototype && chain.length >= 2 && chain[0].name() === 'prototype' && chain[0].holder().isReflecteeProbablyAClass() ? 1 : 0;

      for (var i = chain.length - 1; i >= stopHere; i -= 1) {
        s.append(chain[i].name());
        if (i > stopHere) {s.append(".");}
      }
      return s.toString();
    } else {
      return this.isReflecteeFunction() ? "a function" : this.isReflecteeArray() ? "an array" : "an object";
    }
  }, {category: ['naming']});

  add.method('isWellKnown', function () {
    var chain = this.creatorSlotChain();
    return chain && (chain.length === 0 || chain[0].contents().equals(this));
  }, {category: ['testing']});

  add.method('isReflecteeProbablyAClass', function () {
    // Let's see whether this is a good enough test for now.
    var r = this.reflectee();
    if (r === Object || r === String || r === Function || r === Boolean || r === Array || r === Number) { return true; }
    if (this.isReflecteeFunction() && this.reflecteeHasOwnProperty('superclass')) { return true; }
    return false;
  }, {category: ['testing']});

  add.method('creatorSlotChainExpression', function () {
    if (this.isReflecteePrimitive()) {throw this.inspect() + " does not have a creator slot chain.";}

    var chain = this.creatorSlotChain();
    if (! chain) {throw this.inspect() + " does not have a creator slot chain.";}
    if (chain.length === 0) {return "lobby";}

    var s = stringBuffer.create(lobby === window ? "" : "lobby."); // don't need to say "lobby" if the lobby is the global JS namespace
    
    var sep = "";
    for (var i = chain.length - 1; i >= 0; i -= 1) {
      s.append(sep).append(chain[i].name());
      sep = ".";
    }
    return s.toString();
  }, {category: ['annotations', 'creator slot']});

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
  }, {category: ['annotations', 'creator slot']});

  add.method('eachSlot', function (f) {
    this.eachFakeSlot(f);
    this.eachNormalSlot(f);
  }, {category: ['iterating']});

  add.method('eachFakeSlot', function (f) {
    if (this.isReflecteeFunction()) { f(this.functionBodySlot()); }
    if (this.hasAccessibleParent()) { f(this.      parentSlot()); }
  }, {category: ['iterating']});

  add.method('functionBodySlot', function () {
    return Object.create(lobby.slots.functionBody).initialize(this);
  }, {category: ['functions']});

  add.method('parentSlot', function () {
    return Object.create(lobby.slots.parent).initialize(this);
  }, {category: ['accessing parent']});

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
  }, {category: ['iterating']});

  add.method('eachSlotInCategory', function (c, f) {
    this.eachNormalSlot(function(s) {
      if (c.equals(s.category())) { f(s); }
    });
  }, {category: ['iterating']});

  add.method('eachSlotNestedSomewhereUnderCategory', function (c, f) {
    this.eachNormalSlot(function(s) {
      if (s.category().isEqualToOrSubcategoryOf(c)) { f(s); }
    });
  }, {category: ['iterating']});

  add.method('eachImmediateSubcategoryOf', function (c, f) {
    var subcats = {};
    this.eachNormalSlot(function(s) {
      var sc = s.category();
      if (sc.isSubcategoryOf(c)) {
        var subcatName = sc.part(c.parts().length);
        if (! subcats.hasOwnProperty(subcatName)) {
          subcats[subcatName] = c.subcategory(subcatName);
        }
      }
    });

    for (var name in subcats) {
      if (subcats.hasOwnProperty(name)) {
        f(subcats[name]);
      }
    }
  }, {category: ['iterating']});

  add.method('slotAt', function (n) {
    return Object.create(lobby.slots.plain).initialize(this, n);
  }, {category: ['accessing slot contents']});

  add.method('contentsAt', function (n) {
    return reflect(this.primitiveContentsAt(n));
  }, {category: ['accessing slot contents']});

  add.method('primitiveContentsAt', function (n) {
    return this.reflectee()[n];
  }, {category: ['accessing slot contents']});

  add.method('setContentsAt', function (n, m) {
    this.primitiveSetContentsAt(n, m.reflectee());
  }, {category: ['accessing slot contents']});

  add.method('primitiveSetContentsAt', function (n, o) {
    return this.reflectee()[n] = o;
  }, {category: ['accessing slot contents']});

  add.method('removeSlotAt', function (n) {
    delete this.reflectee()[n];
  }, {category: ['accessing slot contents']});

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
  }, {category: ['accessing slot contents']});

  add.method('reflecteeHasOwnProperty', function (n) {
    if (! this.canHaveSlots()) { return false; }
    return this.reflectee().hasOwnProperty(n);
  }, {category: ['accessing reflectee']});

  add.method('parent', function () {
    if (! this.canAccessParent()) { throw "Sorry, you can't access an object's parent in this browser. Try Firefox or Safari."; }
    if (! this.hasParent()) { throw this.name() + " does not have a parent."; }
    return reflect(this.reflectee().__proto__);
  }, {category: ['accessing parent']});

  add.method('canAccessParent', function () { return String.prototype.__proto__ !== undefined; }, {category: ['accessing parent']});

  add.method('hasParent', function () { return ! (this.isReflecteeNull() || this.isReflecteeUndefined()); }, {category: ['accessing parent']});

  add.method('hasAccessibleParent', function () { return this.canAccessParent() && this.hasParent(); }, {category: ['accessing parent']});

  add.method('setParent', function (pMir) {
    if (! this.canAccessParent()) { throw "Sorry, you can't change an object's parent in this browser. Try Firefox or Safari."; }
    this.reflectee().__proto__ = pMir.reflectee();
  }, {category: ['accessing parent']});

  add.method('createChild', function () {
    var parent = this.reflectee();
    var ChildConstructor = function() {};
    ChildConstructor.prototype = parent;
    var child = new ChildConstructor();
    return reflect(child);
  }, {category: ['children']});

  add.method('source', function () {
    if (! this.isReflecteeFunction()) { throw "not a function"; }
    return this.reflectee().toString();
  }, {category: ['functions']});

  add.method('expressionEvaluatingToMe', function (shouldNotUseCreatorSlotChainExpression) {
    if (this.isReflecteePrimitive()) { return Object.inspect(this.reflectee()); }
    if (!shouldNotUseCreatorSlotChainExpression && this.isWellKnown()) { return this.creatorSlotChainExpression(); }
    if (this.isReflecteeFunction()) { return this.source(); }
    if (this.isReflecteeArray()) { return "[" + this.reflectee().map(function(elem) {return reflect(elem).expressionEvaluatingToMe();}).join(", ") + "]"; }

    // aaa not thread-safe
    if (this.reflectee().__already_calculating_expressionEvaluatingToMe__) { throw "encountered circular structure"; }
    this.reflectee().__already_calculating_expressionEvaluatingToMe__ = true;

    var str = stringBuffer.create("{");
    var sep = "";
    this.eachNormalSlot(function(slot) {
        if (slot.name() !== '__already_calculating_expressionEvaluatingToMe__') {
          str.append(sep).append(slot.name()).append(": ").append(slot.contents().expressionEvaluatingToMe());
          sep = ", ";
        }
    });
    str.append("}");

    delete this.reflectee().__already_calculating_expressionEvaluatingToMe__;

    return str.toString();

    // aaa - try something like Self's 1 _AsObject, except of course in JS it'll have to be a hack
  }, {category: ['naming']});

  add.method('size', function () {
    var size = 0;
    this.eachNormalSlot(function(s) { size += 1; });
    return size;
  }, {category: ['accessing slot contents']});

  add.method('canHaveSlots', function () {
    return ! this.isReflecteePrimitive();
  }, {category: ['accessing slot contents']});

  add.method('canHaveChildren', function () {
    return ! this.isReflecteePrimitive(); // aaa - is this correct?;
  }, {category: ['children']});

  add.method('isReflecteeNull', function () { return this.reflectee() === null;      }, {category: ['testing']});

  add.method('isReflecteeUndefined', function () { return this.reflectee() === undefined; }, {category: ['testing']});

  add.method('isReflecteeString', function () { return typeof this.reflectee() === 'string';  }, {category: ['testing']});

  add.method('isReflecteeNumber', function () { return typeof this.reflectee() === 'number';  }, {category: ['testing']});

  add.method('isReflecteeBoolean', function () { return typeof this.reflectee() === 'boolean'; }, {category: ['testing']});

  add.method('isReflecteeArray', function () { return typeof this.reflectee() === 'object' && this.reflectee() instanceof Array; }, {category: ['testing']});

  add.method('isReflecteePrimitive', function () { return ! (this.isReflecteeObject() || this.isReflecteeFunction()); }, {category: ['testing']});

  add.method('isReflecteeObject', function () {
    var o = this.reflectee();
    var t = typeof o;
    return t === 'object' && o !== null;
  }, {category: ['testing']});

  add.method('isReflecteeFunction', function () {
    return typeof(this.reflectee()) === 'function';
  }, {category: ['testing']});

  add.method('canHaveCreatorSlot', function () {
    // aaa - is this right?
    return this.isReflecteeObject() || this.isReflecteeFunction();
  }, {category: ['annotations', 'creator slot']});

  add.method('creatorSlot', function () {
    var a = this.annotation();
    if (! a) { return null; }
    if (a.hasOwnProperty('creatorSlotHolder') && a.hasOwnProperty('creatorSlotName')) {
      // could cache it if it's slow to keep recreating the Mirror and Slot objects.
      return reflect(a.creatorSlotHolder).slotAt(a.creatorSlotName);
    } else {
      return null;
    }
  }, {category: ['annotations', 'creator slot']});

  add.method('setCreatorSlot', function (s) {
    var a = this.annotationForWriting();
    a.creatorSlotName   = s.name();
    a.creatorSlotHolder = s.holder().reflectee();
  }, {category: ['annotations', 'creator slot']});

  add.method('comment', function () {
    var a = this.annotation();
    if (! a) { return ""; }
    return a.comment || "";
  }, {category: ['annotations', 'comment']});

  add.method('setComment', function (c) {
    this.annotationForWriting().comment = c || "";
  }, {category: ['annotations', 'comment']});

  add.method('copyDownParents', function () {
    var a = this.annotation();
    if (! a) { return []; }
    return a.copyDownParents || [];
  }, {category: ['annotations', 'copy-down parents']});

  add.method('setCopyDownParents', function (cdps) {
    // aaa - Of course, we should be removing slots copied in by the previous list of copy-down parents. But never mind that for now.
    var cdpsMir = reflect(cdps);
    if (! cdpsMir.isReflecteeArray()) { throw "Must be an array; e.g. [{parent: Enumerable}]"; }
    this.annotationForWriting().copyDownParents = cdps;
    for (var i = 0; i < cdps.length; ++i) {
      if (cdps[i].parent === undefined) { throw "Each element of the array must contain a 'parent' slot pointing to the desired copy-down parent; e.g. [{parent: Enumerable}]"; }
      copyDownSlots(this.reflectee(), cdps[i].parent, cdps[i].slotsToOmit);
    }
  }, {category: ['annotations', 'copy-down parents']});

  add.method('canHaveAnnotation', function () {
    return this.isReflecteeObject() || this.isReflecteeFunction();
  }, {category: ['annotations']});

  add.method('hasAnnotation', function () {
    return this.canHaveAnnotation() && this.reflectee().hasOwnProperty("__annotation__");
  }, {category: ['annotations']});

  add.method('annotation', function () {
    if (! this.canHaveAnnotation()) { return null; }
    return this.reflectee().__annotation__;
  }, {category: ['annotations']});

  add.method('annotationForWriting', function () {
    if (! this.hasAnnotation()) {
      if (! this.canHaveAnnotation()) { throw this.name() + " cannot have an annotation"; }
      return this.reflectee().__annotation__ = {slotAnnotations: {}};
    }
    return this.reflectee().__annotation__;
  }, {category: ['annotations']});

  add.method('wellKnownChildren', function () {
    return new ChildFinder(this.reflectee()).go();
  }, {category: ['searching']});

  add.method('wellKnownReferences', function () {
    return new ReferenceFinder(this.reflectee()).go();
  }, {category: ['searching']});

  add.method('categorizeUncategorizedSlotsAlphabetically', function () {
    var uncategorized = Category.root().subcategory("uncategorized");
    this.eachNormalSlot(function(s) {
      var c = s.category();
      if (c.isRoot()) {
        s.setCategory(uncategorized.subcategory((s.name()[0] || '_unnamed_').toUpperCase()));
      }
    });
  }, {category: ['organizing']});

});


thisModule.addSlots(slots, function(add) {

  add.creator('abstract', {});

  add.creator('plain', Object.create(slots.abstract));

  add.creator('parent', Object.create(slots.abstract));

  add.creator('functionBody', Object.create(slots.abstract));

});


thisModule.addSlots(slots.abstract, function(add) {

  add.method('initialize', function (m) {
    this._mirror = m;
    return this;
  }, {category: ['creating']});

  add.data('_mirror', reflect({}), {category: ['accessing'], initializeTo: 'reflect({})'});

  add.method('mirror', function () { return this._mirror; }, {category: ['accessing']});

  add.method('holder', function () { return this._mirror; }, {category: ['accessing']});

  add.method('isFunctionBody', function () { return false; }, {category: ['function bodies']});

  add.method('copyDownParentThatIAmFrom', function () { return null; }, {category: ['copy-down parents']});

  add.method('isFromACopyDownParent', function () { return !! this.copyDownParentThatIAmFrom(); }, {category: ['copy-down parents']});

});


thisModule.addSlots(slots.functionBody, function(add) {

  add.method('name', function () { return "*body*"; }, {category: ['accessing']});

  add.method('contents', function () { return this._mirror; }, {category: ['accessing']});

  add.method('isSimpleMethod', function () { return true; }, {category: ['testing']});

  add.method('isFunctionBody', function () { return true; }, {category: ['testing']});

});


thisModule.addSlots(slots.parent, function(add) {

  add.method('name', function () { return "*parent*"; }, {category: ['accessing']});

  add.method('contents', function () { return this._mirror.parent(); }, {category: ['accessing']});

  add.method('setContents', function (m) { return this._mirror.setParent(m); }, {category: ['accessing']});

  add.method('isSimpleMethod', function () { return false; }, {category: ['testing']});

});


thisModule.addSlots(slots.plain, function(add) {

  add.method('initialize', function (m, n) {
    this._mirror = m;
    this._name = n;
    return this;
  }, {category: ['creating']});

  add.data('_name', 'argleBargle', {category: ['accessing']});

  add.method('name', function () { return this._name; }, {category: ['accessing']});

  add.method('contents', function () { return this._mirror.   contentsAt(this.name()   ); }, {category: ['accessing']});

  add.method('setContents', function (m) { return this._mirror.setContentsAt(this.name(), m); }, {category: ['accessing']});

  add.method('equals', function (s) {
    return this.name() === s.name() && this.mirror().equals(s.mirror());
  }, {category: ['comparing']});

  add.method('toString', function () {
    if (this.name() === undefined) { return ""; }
    return this.name() + " slot";
  }, {category: ['printing']});

  add.method('copyTo', function (newMir) {
    newMir.setContentsAt(this.name(), this.contents());
    return newMir.slotAt(this.name());
  }, {category: ['copying']});

  add.method('remove', function () {
    this.mirror().removeSlotAt(this.name());
  }, {category: ['removing']});

  add.method('isSimpleMethod', function () {
    var contents = this.contents();
    if (! contents.isReflecteeFunction()) {return false;}

    var aaa_LK_slotNamesAttachedToMethods = ['declaredClass', 'methodName'];
    var aaa_LK_slotNamesUsedForSuperHack = ['valueOf', 'toString', 'originalFunction'];

    var hasSuper = contents.reflectee().argumentNames && contents.reflectee().argumentNames().first() === '$super';

    var nonTrivialSlot = Object.newChildOf(enumerator, contents, 'eachNormalSlot').find(function(s) {
      if (            aaa_LK_slotNamesAttachedToMethods.include(s.name())) {return false;}
      if (hasSuper && aaa_LK_slotNamesUsedForSuperHack .include(s.name())) {return false;}
        
      // Firefox seems to have a 'prototype' slot on every function (whereas Safari is lazier about it). I think.
      if (s.name() === 'prototype') {
        var proto = s.contents();
        return ! (proto.size() === 0 && proto.parent().reflectee() === Object.prototype);
      }
      
      return true;
    });
    return ! nonTrivialSlot;
  }, {category: ['testing']});

  add.method('isCreator', function () {
    var cs = this.contents().creatorSlot();
    return cs && cs.equals(this);
  }, {category: ['creator slots']});

  add.method('rename', function (newName) {
    var oldName = this.name();
    if (oldName === newName) {return;}
    var contentsMir = this.contents();
    var o = this.holder().reflectee();
    if (  o.hasOwnProperty(newName)) { throw o + " already has a slot named " + newName; }
    if (! o.hasOwnProperty(oldName)) { throw o + " has no slot named "        + oldName; }

    var isCreator = this.isCreator();

    var contents = o[oldName];
    delete o[oldName];
    o[newName] = contents;
    
    var newSlot = this.holder().slotAt(newName);
    var holderAnno = this.holder().annotationForWriting();
    holderAnno.slotAnnotations[annotationNameForSlotNamed(newName)] = holderAnno.slotAnnotations[annotationNameForSlotNamed(oldName)];
    delete holderAnno.slotAnnotations[annotationNameForSlotNamed(oldName)];

    if (isCreator) {newSlot.beCreator();}

    return newSlot;
  }, {category: ['accessing']});

  add.method('hasAnnotation', function () {
    return this.holder().hasAnnotation() && this.holder().annotation().slotAnnotations[annotationNameForSlotNamed(this.name())];
  }, {category: ['accessing annotation']});

  add.method('annotation', function () {
    var oa = this.holder().annotationForWriting();
    var sa = oa.slotAnnotations[annotationNameForSlotNamed(this.name())];
    if (sa) {return sa;}
    return oa.slotAnnotations[annotationNameForSlotNamed(this.name())] = {};
  }, {category: ['accessing annotation']});

  add.method('beCreator', function () {
    this.contents().setCreatorSlot(this);
  }, {category: ['creator slots']});

  add.method('module', function () {
    if (! this.hasAnnotation()) { return null; }
    return this.annotation().module;
  }, {category: ['accessing annotation', 'module']});

  add.method('setModule', function (m) {
    this.annotation().module = m;
    m.objectsThatMightContainSlotsInMe().push(this.holder().reflectee()); // aaa - there'll be a lot of duplicates; fix the performance later;
  }, {category: ['accessing annotation', 'module']});

  add.method('initializationExpression', function () {
    if (! this.hasAnnotation()) { return ""; }
    return this.annotation().initializeTo || "";
  }, {category: ['accessing annotation', 'initialization expression']});

  add.method('setInitializationExpression', function (e) {
    this.annotation().initializeTo = e;
  }, {category: ['accessing annotation', 'initialization expression']});

  add.method('comment', function () {
    if (! this.hasAnnotation()) { return ""; }
    return this.annotation().comment || "";
  }, {category: ['accessing annotation', 'comment']});

  add.method('setComment', function (c) {
    this.annotation().comment = c || "";
  }, {category: ['accessing annotation', 'comment']});

  add.method('category', function () {
    if (! this.hasAnnotation()) { return Category.root(); }
    var a = this.annotation();
    if (!a.category) { return Category.root(); }
    return new Category(a.category);
  }, {category: ['accessing annotation', 'category']});

  add.method('setCategory', function (c) {
    this.annotation().category = c.parts();
  }, {category: ['accessing annotation', 'category']});

  add.method('copyDownParentThatIAmFrom', function () {
    var name = this.name();
    return this.holder().copyDownParents().find(function(cdp) {
      var parentMir = reflect(cdp.parent);
      if (parentMir.reflecteeHasOwnProperty(name)) {
        var slotsToOmit = cdp.slotsToOmit || [];
        if (typeof slotsToOmit === 'string') { slotsToOmit = slotsToOmit.split(' '); }
        return ! slotsToOmit.include(name);
      } else {
        return false;
      }
    }.bind(this));
  }, {category: ['testing']});

  add.method('fileOutTo', function (buffer) {
    var creationMethod = "data";
    var contentsExpr;
    var contents = this.contents();
    var array = null;
    var isCreator = false;
    var initializer = this.initializationExpression();
    if (initializer) {
      contentsExpr = initializer;
    } else {
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
    }

    buffer.append("  add.").append(creationMethod).append("('").append(this.name()).append("', ").append(contentsExpr);

    var slotAnnoToStringify = {};
    var slotAnno = this.annotation();
    if (slotAnno.comment     ) { slotAnnoToStringify.comment      = slotAnno.comment;      }
    if (slotAnno.category    ) { slotAnnoToStringify.category     = slotAnno.category;     }
    if (slotAnno.initializeTo) { slotAnnoToStringify.initializeTo = slotAnno.initializeTo; }
    var slotAnnoExpr = reflect(slotAnnoToStringify).expressionEvaluatingToMe();

    var objectAnnoExpr;
    if (isCreator) {
      var objectAnnoToStringify = {};
      var objectAnno = contents.annotation();
      if (objectAnno) {
        if (objectAnno.comment        ) {objectAnnoToStringify.comment         = objectAnno.comment;        }
        if (objectAnno.copyDownParents) {objectAnnoToStringify.copyDownParents = objectAnno.copyDownParents;}
        objectAnnoExpr = reflect(objectAnnoToStringify).expressionEvaluatingToMe();
      }
    }
    
    // The fileout looks a bit prettier if we don't bother showing ", {}, {}" all over the place.
    var optionalArgs = "";
    if (objectAnnoExpr && objectAnnoExpr !== '{}') {
      optionalArgs = ", " + objectAnnoExpr + optionalArgs;
    }
    if (optionalArgs !== '' || (slotAnnoExpr && slotAnnoExpr !== '{}')) {
      optionalArgs = ", " + slotAnnoExpr + optionalArgs;
    }
    buffer.append(optionalArgs);

    buffer.append(");\n\n");

    if (array) {
      for (var i = 0, n = array.length; i < n; i += 1) {
        contents.slotAt(i.toString()).fileOutTo(buffer);
      }
    }
  }, {category: ['filing out']});

  add.method('wellKnownImplementors', function () {
    return new ImplementorsFinder(this.name()).go();
  }, {category: ['searching']});

  add.method('hashCode', function () {
    return this.name().hashCode() + this.mirror().hashCode();
  }, {category: ['comparing']});

});


});
