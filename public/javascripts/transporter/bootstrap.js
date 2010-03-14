// Bootstrap the module system.

// aaa - This file is kind of a mess. Gotta figure out exactly what the
// minimal amount of stuff needed here is.

if (typeof Object.create !== 'function') {
    Object.create = function(parent) {
        function F() {}
        F.prototype = parent;
        return new F();
    };
}

if (typeof Object.newChildOf !== 'function') {
    Object.newChildOf = function(parent) {
        var child = Object.create(parent);
        if (child.initialize) {
          var args = $A(arguments); args.shift();
          child.initialize.apply(child, args);
        }
        return child;
    };
}

function annotationOf(o) {
  if (o.hasOwnProperty('__annotation__')) { return o.__annotation__; }
  return o.__annotation__ = {slotAnnotations: {}};
}

function annotationNameForSlotNamed(slotName) {
  // can't just use slotName because it leads to conflicts with stuff inherited from Object.prototype
  return "anno_" + slotName;
}

function existingSlotAnnotation(holder, name) {
  if (! holder.hasOwnProperty('__annotation__')) { return null; }
  var holderAnno = holder.__annotation__;
  if (! holderAnno.slotAnnotations) { return null; }
  return holderAnno.slotAnnotations[annotationNameForSlotNamed(name)];
}

function setCreatorSlot(annotation, name, holder) {
  annotation.creatorSlotName   = name;
  annotation.creatorSlotHolder = holder;
}

function setSlotAnnotation(holder, name, slotAnnotation) {
  annotationOf(holder).slotAnnotations[annotationNameForSlotNamed(name)] = slotAnnotation;
}

function creatorChainLength(o) {
  if (o === lobby) { return 0; }
  if (! o.hasOwnProperty('__annotation__')) { return null; }
  var creatorSlotHolder = o.__annotation__.creatorSlotHolder;
  if (creatorSlotHolder === undefined) { return null; }
  return creatorChainLength(creatorSlotHolder) + 1;
}

function copyDownSlots(dst, src, slotsToOmit) {
  slotsToOmit = slotsToOmit || [];
  if (typeof slotsToOmit === 'string') {
    slotsToOmit = slotsToOmit.split(" ");
  }
  slotsToOmit.push('__annotation__');

  var dstAnno = annotationOf(dst);
  for (var name in src) {
    if (src.hasOwnProperty(name)) {
      if (! slotsToOmit.include(name)) {
        dst[name] = src[name];
        
        // Copy down the category (and maybe other stuff?).
        var srcSlotAnno = existingSlotAnnotation(src, name);
        if (srcSlotAnno && srcSlotAnno.category) {
          var dstSlotAnno = dstAnno.slotAnnotations[annotationNameForSlotNamed(name)] = {};
          dstSlotAnno.category = srcSlotAnno.category;
        }
      }
    }
  }
}

// aaa - Copied from Base.js. Just a hack to make $super work. Not really sure
// what the right solution is in the long run - how do we make this work with
// both prototype-style inheritance and class-style inheritance?
function hackToMakeSuperWork(holder, property, contents) {
  var value = contents;
  var superclass = holder.constructor && holder.constructor.superclass;
  var ancestor = superclass ? superclass.prototype : holder.__proto__;
  if (ancestor && Object.isFunction(value) && value.argumentNames && value.argumentNames().first() === "$super") {
    (function() { // wrapped in a method to save the value of 'method' for advice
      var method = value;
      var advice = (function(m) {
        return function callSuper() { 
          return ancestor[m].apply(this, arguments);
        };
      })(property);
      advice.methodName = "$super:" + (superclass ? superclass.type + "." : "") + property;
      
      value = Object.extend(advice.wrap(method), {
        valueOf:  function() { return method },
        toString: function() { return method.toString() },
        originalFunction: method
      });
    })();
  }
  return value;
}


var lobby = window; // still not sure whether I want this to be window, or Object.create(window), or {}

lobby.modules = {};
setCreatorSlot(annotationOf(lobby.modules), 'modules', lobby);
setSlotAnnotation(lobby, 'modules', {category: ['transporter']});

lobby.transporter = {};
setCreatorSlot(annotationOf(lobby.transporter), 'transporter', lobby);
setSlotAnnotation(lobby, 'transporter', {category: ['transporter']});

lobby.transporter.module = {};
setCreatorSlot(annotationOf(lobby.transporter.module), 'module', lobby.transporter);

lobby.transporter.module.cache = {};

lobby.transporter.module.named = function(n) {
  var m = lobby.modules[n];
  if (m) {return m;}
  m = lobby.modules[n] = Object.create(this);
  m._name = n;
  setCreatorSlot(annotationOf(m), n, lobby.modules);
  lobby.transporter.module.cache[n] = [];
  return m;
};

lobby.transporter.module.create = function(n, block) {
  if (lobby.modules[n]) { throw 'The ' + n + ' module is already loaded.'; }
  block(this.named(n));
};

lobby.transporter.module.slotAdder = {
  data: function(name, contents, slotAnnotation, contentsAnnotation) {
    if (! slotAnnotation) { slotAnnotation = {}; }
    this.holder[name] = contents;
    slotAnnotation.module = this.module;
    setSlotAnnotation(this.holder, name, slotAnnotation);
    if (contentsAnnotation) { // used for creator slots
      var a = annotationOf(contents);
      a.creatorSlotName   = name;
      a.creatorSlotHolder = this.holder;
      Object.extend(a, contentsAnnotation);
      
      if (contentsAnnotation.copyDownParents) {
        for (var i = 0; i < contentsAnnotation.copyDownParents.length; i += 1) {
          var cdp = contentsAnnotation.copyDownParents[i];
          copyDownSlots(contents, cdp.parent, cdp.slotsToOmit);
        }
      }
    }
  },
  
  creator: function(name, contents, slotAnnotation, objectAnnotation) {
    this.data(name, contents, slotAnnotation, objectAnnotation || {});
  },

  method: function(name, contents, slotAnnotation) {
    this.creator(name, hackToMakeSuperWork(this.holder, name, contents), slotAnnotation);
  }
};

lobby.transporter.module.addSlots = function(holder, block) {
  lobby.transporter.module.cache[this._name].push(holder);
  var slotAdder = Object.create(this.slotAdder);
  slotAdder.module = this;
  slotAdder.holder = holder;
  block(slotAdder);
};
