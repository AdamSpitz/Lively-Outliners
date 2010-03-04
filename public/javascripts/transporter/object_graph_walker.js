// Just an experiment to see if I can get decent names.

// Oh, crap, I just realized that if I want to do a traversal of everything,
// after the initial annotation traversal is done, I'm going to need to do
// it twice. I need to put a special marker on the annotations, to show that I've
// been here, and then I need to go through again to remove all the markers.
// Can't just keep a dictionary, since JS can't do efficient identity dictionaries.
// Oh, well. Can't think of a better way at the moment, so let's do that.
// (I mean, I could just leave the markers there, but that kinda sucks.)

Object.subclass("ObjectGraphWalker", {
  initialize: function() {
    this._objectCount = 0; // just for fun
  },

  namesToIgnore: [
    '__annotation__',
    'enabledPlugin'    // aaa just a hack for now - what's this clientInformation thing, and what are these arrays that aren't really arrays?
  ],

  go: function(root) {
    this.reset();
    this._startTime = new Date().getTime();
    this.walk(root === undefined ? lobby : root, 0);
    return this.results();
  },

  reset: function() {
    // children can override
    this._results = [];
    this._objectCount = 0;
  },

  results: function() {
    // children can override
    return this._results;
  },
 
  objectCount: function() { return this._objectCount; },

  inspect: function() {
    return this.constructor.type.prependAOrAn();
  },

  canHaveSlots: function(o) {
    if (o === null) { return false; }
    var t = typeof o;
    return t === 'object' || t === 'function';
  },

  isDOMNode: function(o) {
    // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    return (
      typeof Node === "object" ? o instanceof Node : 
      typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
    );
  },

  isDOMElement: function(o) {
    return (
      typeof HTMLElement === "object" ? o instanceof HTMLElement : // DOM2
      typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string"
    );
  },

  shouldIgnoreObject: function(o) {
    if (this.isDOMNode(o) || this.isDOMElement(o)) { return true; } // the DOM is a nightmare, stay the hell away
    return false;
  },

  markContents: function(holder, slotName, contents, contentsAnno) {
    // Return false if this object has already been marked; otherwise mark it and return true.
    //
    // Would use an identity dictionary here, if JavaScript could do one. As it is, we'll
    // have to mark the annotation and then come by again and unmark it.
    var walkers = contentsAnno.walkers = contentsAnno.walkers || [];
    for (var i = 0; i < walkers.length; i += 1) {
      if (walkers[i] === this) {return false;}
    }
    walkers.push(this);
    return true;
  },

  reachedObject: function(o) {
    // children can override
  },

  reachedSlot: function(holder, slotName, contents) {
    // children can override
  },

  walk: function(currentObj, nesting) {
    nesting = nesting || 0;
    if (nesting > 10) {
      console.log("Nesting level is " + nesting + "; something might be wrong. Not going any deeper.");
      return;
    }

    this._objectCount += 1;
    this.reachedObject(currentObj);

    for (var name in currentObj) {
      if (currentObj.hasOwnProperty(name) && ! this.namesToIgnore.include(name)) {
        var contents, contentsAnno;
        var encounteredStupidFirefoxBug;
        try { contents = currentObj[name]; } catch (ex) { encounteredStupidFirefoxBug = true; }
        if (! encounteredStupidFirefoxBug) {
          this.reachedSlot(currentObj, name, contents);
          if (this.canHaveSlots(contents)) {
            if (contents.constructor !== Array) { // aaa - this isn't right. But I don't wanna walk all the indexables.
              if (! this.shouldIgnoreObject(contents)) {
                try { contentsAnno = annotationOf(contents); } catch (ex) { encounteredStupidFirefoxBug = true; }
                if (! encounteredStupidFirefoxBug) {
                  if (this.markContents(currentObj, name, contents, contentsAnno)) {
                    this.walk(contents, nesting + 1);
                  }
                }
              }
            }
          }
        }
      }
    }
  },
});

ObjectGraphWalker.subclass("CreatorSlotMarker", {
  markContents: function(holder, slotName, contents, contentsAnno) {
    if (contentsAnno.hasOwnProperty('creatorSlotName')) {
      if (creatorChainLength(holder) < creatorChainLength(contentsAnno.creatorSlotHolder)) {
        // This one's shorter, so probably better; use it instead.
        setCreatorSlot(contentsAnno, slotName, holder);
      }
      return false;
    } else {
      setCreatorSlot(contentsAnno, slotName, holder);
      return true;
    }
  },
});

CreatorSlotMarker.annotateExternalObjects = function() {
  var marker = new this();
  marker.walk(lobby);
  // aaa - WTFJS, damned for loops don't seem to see String and Number and Array and their 'prototype' slots.
  ['Object', 'String', 'Number', 'Boolean', 'Array', 'Function'].each(function(typeName) {
    var type = window[typeName];
    marker.markContents(window, typeName, type, annotationOf(type));
    marker.markContents(type, 'prototype', type.prototype, annotationOf(type.prototype));
    marker.walk(type.prototype);
  });
};


// aaa - these guys below probably belong in another module

ObjectGraphWalker.subclass("ImplementorsFinder", {
  initialize: function($super, slotName) {
    $super();
    this.slotNameToSearchFor = slotName;
  },

  inspect: function() { return "Well-known implementors of '" + this.slotNameToSearchFor + "'"; },

  reachedSlot: function(holder, slotName, contents) {
    if (slotName === this.slotNameToSearchFor && reflect(holder).creatorSlotChain()) {
      this._results.push(reflect(holder).slotAt(slotName));
    }
  },
});

ObjectGraphWalker.subclass("ReferenceFinder", {
  initialize: function($super, o) {
    $super();
    this.objectToSearchFor = o;
  },

  reachedSlot: function(holder, slotName, contents) {
    if (contents === this.objectToSearchFor && reflect(holder).creatorSlotChain()) {
      this._results.push(holder);
    }
  },

  reachedObject: function(o) {
    if (reflect(o).parent().reflectee() === this.objectToSearchFor && reflect(o).creatorSlotChain()) {
      this._results.push(o);
    }
  },
});

ObjectGraphWalker.subclass("ChildFinder", {
  initialize: function($super, o) {
    $super();
    this.objectToSearchFor = o;
  },

  reachedObject: function(o) {
    if (reflect(o).parent().reflectee() === this.objectToSearchFor && reflect(o).creatorSlotChain()) {
      this._results.push(o);
    }
  },
});
