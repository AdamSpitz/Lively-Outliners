// Bootstrap the module system.

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

function setCreatorSlot(annotation, name, holder) {
  annotation.creatorSlotName   = name;
  annotation.creatorSlotHolder = holder;
}

function creatorChainLength(o) {
  if (o === lobby) { return 0; }
  if (! o.hasOwnProperty('__annotation__')) { return null; }
  var creatorSlotHolder = o.__annotation__.creatorSlotHolder;
  if (creatorSlotHolder === undefined) { return null; }
  return creatorChainLength(creatorSlotHolder) + 1;
}

var lobby = window; // still not sure whether I want this to be window, or Object.create(window), or {}

lobby.modules = {};
setCreatorSlot(annotationOf(lobby.modules), 'modules', lobby);

lobby.transporter = {};
setCreatorSlot(annotationOf(lobby.transporter), 'transporter', lobby);

lobby.transporter.module = {};
setCreatorSlot(annotationOf(lobby.transporter.module), 'module', lobby.transporter);

lobby.transporter.module.cache = {};

lobby.transporter.module.named = function(n) {
  var m = lobby.modules[n];
  if (m) {return m;}
  m = lobby.modules[n] = Object.create(this);
  m._name = n;
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
    annotationOf(this.holder).slotAnnotations[name] = slotAnnotation;
    if (contentsAnnotation) { // used for creator slots
      var a = annotationOf(contents);
      a.creatorSlotName   = name;
      a.creatorSlotHolder = this.holder;
      Object.extend(a, contentsAnnotation);
      
      if (contentsAnnotation.copyDownParents) {
        for (var i = 0; i < contentsAnnotation.copyDownParents.length; i += 1) {
          Object.extend(contents, eval(contentsAnnotation.copyDownParents[i].expression));
        }
      }
    }
  },
  
  creator: function(name, contents, slotAnnotation, objectAnnotation) {
    this.data(name, contents, slotAnnotation, objectAnnotation || {});
  },

  method: function(name, contents, slotAnnotation) {
    this.creator(name, contents, slotAnnotation);
  }
};

lobby.transporter.module.addSlots = function(holder, block) {
  lobby.transporter.module.cache[this._name].push(holder);
  var slotAdder = Object.create(this.slotAdder);
  slotAdder.module = this;
  slotAdder.holder = holder;
  block(slotAdder);
};
