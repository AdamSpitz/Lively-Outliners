lobby.transporter.module.create('object_graph_walker', function(requires) {}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('ObjectGraphWalker', function ObjectGraphWalker() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('CreatorSlotMarker', function CreatorSlotMarker() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('ImplementorsFinder', function ImplementorsFinder() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('ReferenceFinder', function ReferenceFinder() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('ChildFinder', function ChildFinder() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('TestingObjectGraphWalker', function TestingObjectGraphWalker() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

});


thisModule.addSlots(ObjectGraphWalker, function(add) {

  add.data('superclass', Object);

  add.creator('prototype', {});

  add.data('type', 'ObjectGraphWalker');

  add.method('Tests', function Tests() { Class.initializer.apply(this, arguments); }, {category: ['tests']});

});


thisModule.addSlots(ChildFinder, function(add) {

  add.data('superclass', ObjectGraphWalker);

  add.creator('prototype', Object.create(ObjectGraphWalker.prototype));

  add.data('type', 'ChildFinder');

});


thisModule.addSlots(ChildFinder.prototype, function(add) {

  add.data('constructor', ChildFinder);

  add.method('initialize', function ($super, o) {
    $super();
    this.objectToSearchFor = o;
  });

  add.method('reachedObject', function (o) {
    if (reflect(o).parent().reflectee() === this.objectToSearchFor && reflect(o).creatorSlotChain()) {
      this._results.push(o);
    }
  });

});


thisModule.addSlots(ImplementorsFinder, function(add) {

  add.data('superclass', ObjectGraphWalker);

  add.creator('prototype', Object.create(ObjectGraphWalker.prototype));

  add.data('type', 'ImplementorsFinder');

});


thisModule.addSlots(ImplementorsFinder.prototype, function(add) {

  add.data('constructor', ImplementorsFinder);

  add.method('initialize', function ($super, slotName) {
    $super();
    this.slotNameToSearchFor = slotName;
  });

  add.method('inspect', function () { return "Well-known implementors of '" + this.slotNameToSearchFor + "'"; });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (slotName === this.slotNameToSearchFor && reflect(holder).creatorSlotChain()) {
      this._results.push(reflect(holder).slotAt(slotName));
    }
  });

});


thisModule.addSlots(ReferenceFinder, function(add) {

  add.data('superclass', ObjectGraphWalker);

  add.creator('prototype', Object.create(ObjectGraphWalker.prototype));

  add.data('type', 'ReferenceFinder');

});


thisModule.addSlots(ReferenceFinder.prototype, function(add) {

  add.data('constructor', ReferenceFinder);

  add.method('initialize', function ($super, o) {
    $super();
    this.objectToSearchFor = o;
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (contents === this.objectToSearchFor) {
      var holderMir = reflect(holder);
      if (holderMir.creatorSlotChain()) {
        this._results.push(holderMir.slotAt(slotName));
      }
    }
  });

  add.method('reachedObject', function (o) {
    var mir = reflect(o);
    if (mir.parent().reflectee() === this.objectToSearchFor && mir.creatorSlotChain()) {
      this._results.push(mir.parentSlot());
    }
  });

});


thisModule.addSlots(ObjectGraphWalker.prototype, function(add) {

  add.data('constructor', ObjectGraphWalker);

  add.method('initialize', function () {
    this._objectCount = 0; // just for fun;
  });

  add.data('namesToIgnore', ["__annotation__", "localStorage", "sessionStorage", "globalStorage", "enabledPlugin"], {comment: 'Having enabledPlugin in here is just a hack for now - what\'s this clientInformation thing, and what are these arrays that aren\'t really arrays?', initializeTo: '["__annotation__", "enabledPlugin"]'});

  add.method('go', function (root) {
    this.reset();
    this._startTime = new Date().getTime();
    this.walk(root === undefined ? lobby : root, 0);
    this.undoAllMarkings();
    return this.results();
  });

  add.method('reset', function () {
    // children can override
    this._results = [];
    this._marked = [];
    this._objectCount = 0;
  });

  add.method('results', function () {
    // children can override
    return this._results;
  });

  add.method('objectCount', function () { return this._objectCount; });

  add.method('inspect', function () {
    return this.constructor.type.prependAOrAn();
  });

  add.method('canHaveSlots', function (o) {
    if (o === null) { return false; }
    var t = typeof o;
    return t === 'object' || t === 'function';
  });

  add.method('isDOMNode', function (o) {
    // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    if (typeof Node === "object" && o instanceof Node) { return true; }
    if (typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string") { return true; }
    return false;
  });

  add.method('isDOMElement', function (o) {
    if (typeof HTMLElement       === "object" && o instanceof HTMLElement          ) { return true; }
    if (typeof HTMLIFrameElement === "object" && o instanceof HTMLIFrameElement    ) { return true; }
    if (typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string") { return true; }
    return false;
  });

  add.method('shouldIgnoreObject', function (o) {
    if (this.isDOMNode(o) || this.isDOMElement(o)) { return true; } // the DOM is a nightmare, stay the hell away
    return false;
  });

  add.method('markObject', function (object, howDidWeGetHere) {
    // Return false if this object has already been marked; otherwise mark it and return true.
    //
    // Would use an identity dictionary here, if JavaScript could do one. As it is, we'll
    // have to mark the annotation and then come by again and unmark it.
    var objectAnno;
    try { objectAnno = annotator.annotationOf(object); } catch (ex) { return false; } // stupid FireFox bug
    var walkers = objectAnno.walkers = objectAnno.walkers || (Global.set && Object.newChildOf(set, hashTable.identityComparator)) || [];
    if (walkers.include(this)) { return false; }
    walkers.push(this);
    this._marked.push(objectAnno);
    return true;
  });

  add.method('undoAllMarkings', function () {
    // Could walk the graph again so that we don't need to create this big
    // list of marked stuff. But for now this'll do.
    if (! this._marked) { return; }
    this._marked.each(function(m) { m.walkers.remove(this); }.bind(this));
    this._marked = [];
  });

  add.method('reachedObject', function (o) {
    // children can override;
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    // children can override;
  });

  add.method('walk', function (currentObj, howDidWeGetHere) {
    if (this.shouldIgnoreObject(currentObj, howDidWeGetHere)) { return; }
    if (! this.markObject(currentObj, howDidWeGetHere)) { return; }

    this._objectCount += 1;
    this.reachedObject(currentObj, howDidWeGetHere);

    for (var name in currentObj) {
      if (currentObj.hasOwnProperty(name) && ! this.namesToIgnore.include(name)) {
        var contents;
        var encounteredStupidFirefoxBug = false;
        try { contents = currentObj[name]; } catch (ex) { encounteredStupidFirefoxBug = true; }
        if (! encounteredStupidFirefoxBug) {
          this.reachedSlot(currentObj, name, contents);
          if (this.canHaveSlots(contents)) {
            if (contents.constructor !== Array || this.shouldWalkIndexables) { // aaa - this isn't right. But I don't wanna walk all the indexables.
              this.walk(contents, {previous: howDidWeGetHere, slotHolder: currentObj, slotName: name});
            }
          }
        }
      }
    }
  });

});


thisModule.addSlots(CreatorSlotMarker, function(add) {

  add.data('superclass', ObjectGraphWalker);

  add.creator('prototype', Object.create(ObjectGraphWalker.prototype));

  add.data('type', 'CreatorSlotMarker');

  add.method('annotateExternalObjects', function (shouldMakeCreatorSlots, moduleForExpatriateSlots) {
  var marker = new this();
  marker.moduleForExpatriateSlots = moduleForExpatriateSlots;
  marker.shouldMakeCreatorSlots = shouldMakeCreatorSlots;
  marker.reset();
  marker.walk(lobby);
  // aaa - WTFJS, damned for loops don't seem to see String and Number and Array and their 'prototype' slots.
  ['Object', 'String', 'Number', 'Boolean', 'Array', 'Function'].each(function(typeName) {
    var type = window[typeName];
    var pathToType          = {                       slotHolder: window, slotName:  typeName   };
    var pathToTypePrototype = { previous: pathToType, slotHolder:   type, slotName: 'prototype' };
    marker.markObject(type, pathToType);
    marker.markObject(type.prototype, pathToTypePrototype);
    marker.walk(type.prototype);
  });
});

});


thisModule.addSlots(CreatorSlotMarker.prototype, function(add) {

  add.data('constructor', CreatorSlotMarker);

  add.method('markObject', function ($super, contents, howDidWeGetHere) {
    this.reachedObject(contents, howDidWeGetHere); // in case this is a shorter path
    return $super(contents, howDidWeGetHere);
  });

  add.method('reachedObject', function (contents, howDidWeGetHere) {
    if (! this.shouldMakeCreatorSlots) { return; }
    if (! howDidWeGetHere) { return; }
    if (contents === Global) { return; }
    var contentsAnno;
    var slotHolder = howDidWeGetHere.slotHolder;
    var slotName   = howDidWeGetHere.slotName;
    try { contentsAnno = annotator.annotationOf(contents); } catch (ex) { return false; } // stupid FireFox bug
    if (contentsAnno.hasOwnProperty('creatorSlotName')) {
      if (annotator.creatorChainLength(slotHolder) < annotator.creatorChainLength(contentsAnno.creatorSlotHolder)) {
        // This one's shorter, so probably better; use it instead.
        contentsAnno.setCreatorSlot(slotName, slotHolder);
      }
    } else {
      contentsAnno.setCreatorSlot(slotName, slotHolder);
    }
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    if (! this.moduleForExpatriateSlots) { return; }
    var existingSlotAnno = annotator.existingSlotAnnotation(holder, slotName);
    var slotAnno = existingSlotAnno || {};
    if (slotAnno.module) { return; }
    slotAnno.module = this.moduleForExpatriateSlots;
    annotator.annotationOf(holder).setSlotAnnotation(slotName, slotAnno);
  });

});


thisModule.addSlots(TestingObjectGraphWalker, function(add) {

  add.data('superclass', ObjectGraphWalker);

  add.creator('prototype', Object.create(ObjectGraphWalker.prototype));

  add.data('type', 'TestingObjectGraphWalker');

});


thisModule.addSlots(TestingObjectGraphWalker.prototype, function(add) {

  add.data('constructor', TestingObjectGraphWalker);

  add.method('initialize', function ($super) {
    $super();
  });

  add.method('reset', function ($super) {
    $super();
    this._objectsReached = [];
    this._slotsReached = [];
  });

  add.method('reachedObject', function (o) {
    this._objectsReached.push(o);
  });

  add.method('reachedSlot', function (holder, slotName, contents) {
    var slot = reflect(holder).slotAt(slotName);
    this._slotsReached.push(slot);
  });

  add.method('undoAllMarkings', function () {
    // Don't undo them, so that the tests can examine the _marked list.
  });

});


thisModule.addSlots(ObjectGraphWalker.Tests, function(add) {

  add.data('superclass', TestCase);

  add.creator('prototype', Object.create(TestCase.prototype));

  add.data('type', 'ObjectGraphWalker.Tests');

});


thisModule.addSlots(ObjectGraphWalker.Tests.prototype, function(add) {

  add.data('constructor', ObjectGraphWalker.Tests);

  add.method('testIncremental', function () {
    var w1 = new TestingObjectGraphWalker();
    w1.go();
    var n = 'ObjectGraphWalker_Tests___extraSlotThatIAmAdding';
    var o = {};
    Global[n] = o;
    var w2 = new TestingObjectGraphWalker();
    w2.go();
    this.assertEqual(w1.objectCount() + 1, w2.objectCount());
    delete Global[n];
  });

});


thisModule.addSlots(modules.object_graph_walker, function(add) {

  add.data('_directory', 'transporter', {category: []});

});


});
