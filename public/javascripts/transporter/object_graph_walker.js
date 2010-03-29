lobby.transporter.module.create('object_graph_walker', function(requires) {}, function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.method('ObjectGraphWalker', function ObjectGraphWalker() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('CreatorSlotMarker', function CreatorSlotMarker() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('ImplementorsFinder', function ImplementorsFinder() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('ReferenceFinder', function ReferenceFinder() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

  add.method('ChildFinder', function ChildFinder() { Class.initializer.apply(this, arguments); }, {category: ['transporter']});

});


thisModule.addSlots(ObjectGraphWalker, function(add) {

  add.data('superclass', Object);

  add.creator('prototype', {});

  add.data('type', 'ObjectGraphWalker');

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


thisModule.addSlots(CreatorSlotMarker, function(add) {

  add.data('superclass', ObjectGraphWalker);

  add.creator('prototype', Object.create(ObjectGraphWalker.prototype));

  add.data('type', 'CreatorSlotMarker');

  add.method('annotateExternalObjects', function (moduleForExpatriateSlots) {
  var marker = new this();
  marker.moduleForExpatriateSlots = moduleForExpatriateSlots;
  marker.walk(lobby);
  // aaa - WTFJS, damned for loops don't seem to see String and Number and Array and their 'prototype' slots.
  ['Object', 'String', 'Number', 'Boolean', 'Array', 'Function'].each(function(typeName) {
    var type = window[typeName];
    marker.markContents(window, typeName, type);
    marker.markContents(type, 'prototype', type.prototype);
    marker.walk(type.prototype);
  });
});

});


thisModule.addSlots(CreatorSlotMarker.prototype, function(add) {

  add.data('constructor', CreatorSlotMarker);

  add.method('markContents', function (holder, slotName, contents) {
    var contentsAnno;
    try { contentsAnno = annotator.annotationOf(contents); } catch (ex) { return false; } // stupid FireFox bug
    if (contentsAnno.hasOwnProperty('creatorSlotName')) {
      if (annotator.creatorChainLength(holder) < annotator.creatorChainLength(contentsAnno.creatorSlotHolder)) {
        // This one's shorter, so probably better; use it instead.
        contentsAnno.setCreatorSlot(slotName, holder);
      }
      return false;
    } else {
      contentsAnno.setCreatorSlot(slotName, holder);
      return true;
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
    return (
      typeof Node === "object" ? o instanceof Node : 
      typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
    );
  });

  add.method('isDOMElement', function (o) {
    return (
      typeof HTMLElement === "object" ? o instanceof HTMLElement : // DOM2
      typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string"
    );
  });

  add.method('shouldIgnoreObject', function (o) {
    if (this.isDOMNode(o) || this.isDOMElement(o)) { return true; } // the DOM is a nightmare, stay the hell away
    return false;
  });

  add.method('markContents', function (holder, slotName, contents) {
    // Return false if this object has already been marked; otherwise mark it and return true.
    //
    // Would use an identity dictionary here, if JavaScript could do one. As it is, we'll
    // have to mark the annotation and then come by again and unmark it.
    var contentsAnno;
    try { contentsAnno = annotator.annotationOf(contents); } catch (ex) { return false; } // stupid FireFox bug
    var walkers = contentsAnno.walkers = contentsAnno.walkers || Object.newChildOf(set, hashTable.identityComparator);
    if (walkers.include(this)) { return false; }
    walkers.add(this);
    this._marked.push(contentsAnno);
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

  add.method('walk', function (currentObj, nesting) {
    nesting = nesting || 0;
    this._objectCount += 1;
    this.reachedObject(currentObj);

    for (var name in currentObj) {
      if (currentObj.hasOwnProperty(name) && ! this.namesToIgnore.include(name)) {
        var contents;
        var encounteredStupidFirefoxBug = false;
        try { contents = currentObj[name]; } catch (ex) { encounteredStupidFirefoxBug = true; }
        if (! encounteredStupidFirefoxBug) {
          this.reachedSlot(currentObj, name, contents);
          if (this.canHaveSlots(contents)) {
            if (contents.constructor !== Array || this.shouldWalkIndexables) { // aaa - this isn't right. But I don't wanna walk all the indexables.
              if (! this.shouldIgnoreObject(contents)) {
                if (this.markContents(currentObj, name, contents)) {
                  this.walk(contents, nesting + 1);
                }
              }
            }
          }
        }
      }
    }
  });

});


thisModule.addSlots(modules.object_graph_walker, function(add) {

  add.data('_directory', 'transporter', {category: []});

});


});
