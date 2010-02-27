lobby.transporter.module.create('mirrors', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('mirror', {});

});


thisModule.addSlots(lobby.mirror, function(add) {

  add.method('initialize', function (o) {
    this._reflectee = o;
  });

  add.method('reflectee', function () { return this._reflectee; });

  add.method('equals', function (m) {
    return this.reflectee() === m.reflectee();
  });

  add.method('toString', function () {
    return "a mirror"; // aaa - crap, hash tables will be linear time now; can I get an object ID somehow?;
  });

  add.method('inspect', function () {
    if (this.reflectee() === lobby) {return "lobby";} // aaa - just a hack for now, until I can make it come out right for real
    return this.name(); // later can add the concept of complete objects, so I can do a toString();
  });

  add.method('name', function () {
    if (this.isReflecteePrimitive()) {return "" + this.reflectee();}

    var chain = this.creatorSlotChain();
    if (chain) {
      if (chain.length === 0) {return "";}
      var isThePrototype = chain[0].contents().equals(this);
      var s = new StringBuffer(isThePrototype ? "" : (/^[AEIOUaeiou]/).exec(chain[chain.length - 1].name()) ? "an " : "a ");
      for (var i = chain.length - 1; i >= 0; i -= 1) {
        s.append(chain[i].name());
        if (i > 0) {s.append(" ");}
      }
      return s.toString();
    } else {
      return this.isReflecteeFunction() ? "a function" : "an object";
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

  add.method('reflecteeToString', function () {
    return "" + this.reflectee();
  });

  add.method('eachSlot', function (f) {
    f(new ParentSlot(this));
    this.eachNonParentSlot(f);
  });

  add.method('eachNonParentSlot', function (f) {
    if (! this.canHaveSlots()) {return;} // aaa - should this go one line up? Do primitives have a parent? Or maybe numbers do but null doesn't or something?
    var o = this.reflectee();
    for (var name in o) {
      if (o.hasOwnProperty(name)) {
        if (name !== '__annotation__') { // shh! pretend it's not there.
          f(this.slotAt(name));
        }
      }
    }
  });

  add.method('slotAt', function (n) {
    return new Slot(n, this);
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
    var o = this.reflectee();
    if (! is_proto_property_supported) {
      return reflect(o.__parent_slot_that_does_not_actually_mean_anything_but_is_here_for_reflective_purposes__);
    } else {
      return reflect(o.__proto__);
    }
  });

  add.method('canSetParent', function () { return is_proto_property_supported; });

  add.method('setParent', function (pMir) {
    if (! this.canSetParent()) { throw "Sorry, you can't change an object's parent in this browser. Try Firefox or Safari."; }
    this.reflectee().__proto__ = pMir.reflectee();
  });

  add.method('createChild', function () {
    var parent = this.reflectee();
    var ChildConstructor = is_proto_property_supported ? function() {} : function() {this.__parent_slot_that_does_not_actually_mean_anything_but_is_here_for_reflective_purposes__ = parent;};
    ChildConstructor.prototype = parent;
    var child = new ChildConstructor();
    return reflect(child);
  });

  add.method('source', function () {
    if (! this.isReflecteeFunction()) { throw "not a function"; }
    return this.reflectee().toString();
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
    if (! this.hasAnnotation()) { return null; }
    var a = this.annotation();
    if (a.hasOwnProperty('creatorSlotHolder') && a.hasOwnProperty('creatorSlotName')) {
      // could cache it if it's slow to keep recreating the Mirror and Slot objects.
      return reflect(a.creatorSlotHolder).slotAt(a.creatorSlotName);
    } else {
      return null;
    }
  });

  add.method('setCreatorSlot', function (s) {
    var a = this.annotation();
    a.creatorSlotName   = s.name();
    a.creatorSlotHolder = s.holder().reflectee();
  });

  add.method('canHaveAnnotation', function () {
    return this.isReflecteeObject() || this.isReflecteeFunction();
  });

  add.method('hasAnnotation', function () {
    return this.canHaveAnnotation() && this.reflectee().hasOwnProperty("__annotation__");
  });

  add.method('annotation', function () {
    if (! this.hasAnnotation()) {
      if (! this.canHaveAnnotation()) { throw this.name() + " cannot have an annotation"; }
      return this.reflectee().__annotation__ = {slotAnnotations: {}};
    }
    return this.reflectee().__annotation__;
  });

});


});