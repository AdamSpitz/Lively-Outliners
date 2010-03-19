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
  // Why doesn't JSLint like it when I put this all on one line?
  var a = {slotAnnotations: {}};
  o.__annotation__ = a;
  return a;
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

function adjustSlotsToOmit(rawSlotsToOmit) {
  var slotsToOmit = rawSlotsToOmit || [];
  if (typeof slotsToOmit === 'string') {
    slotsToOmit = slotsToOmit.split(" ");
  }
  slotsToOmit.push('__annotation__');
  return slotsToOmit;
}

function copyDownSlots(dst, src, rawSlotsToOmit) {
  var slotsToOmit = adjustSlotsToOmit(rawSlotsToOmit);
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
  var ancestor = superclass ? superclass.prototype : holder['__proto__']; // using [] to fool JSLint
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
        valueOf:  function() { return method; },
        toString: function() { return method.toString(); },
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


lobby.transporter.module.create('bootstrap', function(thisModule) {

thisModule.addSlots(transporter.module, function(add) {

  add.method('existingOneNamed', function (n) {
    return lobby.modules[n];
  }, {category: ['accessing']});

  add.method('urlForModuleDirectory', function (directory) {
    if (! directory) { directory = ""; }
    if (directory && directory[directory.length] !== '/') { directory += '/'; }
    var baseDirURL = URL.source.getDirectory().withRelativePath("javascripts/");
    return baseDirURL.withRelativePath(directory);
  }, {category: ['saving to WebDAV']});

  add.method('urlForModuleName', function (name, directory) {
    var moduleDirURL = this.urlForModuleDirectory(directory);
    return moduleDirURL.withFilename(name + ".js");
  }, {category: ['saving to WebDAV']});

  add.method('loadJSFile', function (url, scriptLoadedCallback) {
    // I really hope "with" is the right thing to do here. We seem to need
    // it in order to make globally-defined things work.
    with (Global) { eval(FileDirectory.getContent(url)); }
    // Doing this the callback way because we may in the future want to switch to loading
    // the file asynchronously.
    scriptLoadedCallback();
  }, {category: ['transporting']});

  add.method('fileIn', function (directory, name, scriptLoadedCallback) {
    var url = this.urlForModuleName(name, directory);
    this.loadJSFile(url, function() {
      var module = this.existingOneNamed(name);
      if (module) {
        if (module.postFileIn) { module.postFileIn(); }
      } else {
        // Could just be some external Javascript library - doesn't have
        // to be one of our modules.
      }
      if (scriptLoadedCallback) { scriptLoadedCallback(module); }
    }.bind(this));
  }, {category: ['transporting']});

  add.method('requires', function(moduleDir, moduleName) {
    if (! this._requirements) { this._requirements = []; }
    this._requirements.push([moduleDir, moduleName]);
    
    if (transporter.module.existingOneNamed(name)) { return; }
    transporter.module.fileIn(moduleDir, moduleName);
  }, {category: ['requirements']});

});

});
