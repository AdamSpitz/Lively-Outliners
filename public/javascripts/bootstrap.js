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

// Gotta overwrite the standard Object.extend, or bad things happen with annotations.
Object.extend = function extend(destination, source) {
  for (var property in source) {
    if (property !== '__annotation__') {
      destination[property] = source[property];
    }
  }
  return destination;
};


function annotationOf(o) {
  if (o.hasOwnProperty('__annotation__')) { return o.__annotation__; }
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
  var holderAnno = annotationOf(holder);
  holderAnno.slotAnnotations[annotationNameForSlotNamed(name)] = slotAnnotation;
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
  if (ancestor && typeof(value) === 'function' && value.argumentNames && value.argumentNames().first() === "$super") {
    (function() { // wrapped in a method to save the value of 'method' for advice
      var method = value;
      var advice = (function(m) {
        return function callSuper() { 
          return ancestor[m].apply(this, arguments);
        };
      })(property);
      advice.methodName = "$super:" + (superclass ? superclass.type + "." : "") + property;
      
      value = advice.wrap(method);
      value.valueOf = function() { return method; };
      value.toString = function() { return method.toString(); };
      value.originalFunction = method;
    })();
  }
  return value;
}


function waitForAllCallbacks(functionThatYieldsCallbacks, functionToRunWhenDone, aaa_name) {
  var callbacks = [];
  var numberOfCallsExpected = 0;
  var numberCalledSoFar = 0;
  var doneYieldingCallbacks = false;
  var alreadyDone = false;
  
  var checkWhetherDone = function() {
    if (alreadyDone) {
      throw "Whoa, called a callback again after we're already done.";
    }

    if (! doneYieldingCallbacks) { return; }

    if (numberCalledSoFar >= numberOfCallsExpected) {
      alreadyDone = true;
      console.log("OK, we seem to be done " + aaa_name + ". Here are the subguys: " + callbacks.map(function(cb) {return cb.aaa_name;}).join(', '));
      functionToRunWhenDone();
    }
  };

  functionThatYieldsCallbacks(function() {
    numberOfCallsExpected += 1;
    var callback = function() {
      if (callback.alreadyCalled) {
        throw "Wait a minute, this one was already called!";
      }
      callback.alreadyCalled = true;
      numberCalledSoFar += 1;
      checkWhetherDone();
    };
    callbacks.push(callback);
    return callback;
  });
  doneYieldingCallbacks = true;
  if (! alreadyDone) { checkWhetherDone(); }
}



var lobby = window; // still not sure whether I want this to be window, or Object.create(window), or {}

lobby.modules = {};
setCreatorSlot(annotationOf(lobby.modules), 'modules', lobby);
setSlotAnnotation(lobby, 'modules', {category: ['transporter']});

lobby.transporter = {};
setCreatorSlot(annotationOf(lobby.transporter), 'transporter', lobby);
setSlotAnnotation(lobby, 'transporter', {category: ['transporter']});

lobby.transporter.loadedURLs = {};

lobby.transporter.module = {};
setCreatorSlot(annotationOf(lobby.transporter.module), 'module', lobby.transporter);

lobby.transporter.module.cache = {};

lobby.transporter.module.onLoadCallbacks = {};

lobby.transporter.module.named = function(n) {
  var m = lobby.modules[n];
  if (m) {return m;}
  m = lobby.modules[n] = Object.create(this);
  m._name = n;
  setCreatorSlot(annotationOf(m), n, lobby.modules);
  lobby.transporter.module.cache[n] = [];
  return m;
};

lobby.transporter.module.create = function(n, reqBlock, contentsBlock) {
  // console.log("Creating module: " + n);
  if (lobby.modules[n]) { throw 'The ' + n + ' module is already loaded.'; }
  var newModule = this.named(n);
  waitForAllCallbacks(function(finalCallback) {
    reqBlock(function(reqDir, reqName) {
      newModule.requires(reqDir, reqName, Object.extend(finalCallback(), {aaa_name: reqName}));
    });
  }, function() {
    contentsBlock(newModule);
    // console.log("Finished loading module: " + n);
    if (newModule.postFileIn) { newModule.postFileIn(); }
    var onLoadCallback = transporter.module.onLoadCallbacks[n];
    if (onLoadCallback) {
      delete transporter.module.onLoadCallbacks[n];
      onLoadCallback();
    }
  }, n);
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
      
      for (var property in contentsAnnotation) {
        if (contentsAnnotation.hasOwnProperty(property)) {
          a[property] = contentsAnnotation[property];
        }
      }
      
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


lobby.transporter.module.create('bootstrap', function(requires) {}, function(thisModule) {

thisModule.addSlots(transporter.module, function(add) {

  add.method('existingOneNamed', function (n) {
    return lobby.modules[n];
  }, {category: ['accessing']});

  add.method('urlForModuleDirectory', function (directory) {
    if (! directory) { directory = ""; }
    if (directory && directory[directory.length] !== '/') { directory += '/'; }
    var docURL = document.documentURI;
    var baseDirURL = docURL.substring(0, docURL.lastIndexOf("/")) + "/javascripts/";
    return baseDirURL + directory;
  }, {category: ['saving to WebDAV']});

  add.method('urlForModuleName', function (name, directory) {
    var moduleDirURL = this.urlForModuleDirectory(directory);
    return moduleDirURL + name + ".js";
  }, {category: ['saving to WebDAV']});

  add.method('loadJSFile', function (url, scriptLoadedCallback) {
    // aaa old way, relies on a bunch of stuff that I'd rather not have to load first:
    // var _fileContents = FileDirectory.getContent(url);

    scriptLoadedCallback = scriptLoadedCallback || function() {};

    var loadingStatus = transporter.loadedURLs[url];
    if (typeof loadingStatus === 'function') {
      transporter.loadedURLs[url] = function() {
        loadingStatus();
        scriptLoadedCallback();
      };
      return;
    } else if (loadingStatus === 'done') {
      return scriptLoadedCallback();
    }

    transporter.loadedURLs[url] = scriptLoadedCallback;

    var shouldUseXMLHttpRequest = false; // aaa - not sure which way is better; seems to be a tradeoff
    if (shouldUseXMLHttpRequest) {
      var req = new XMLHttpRequest();
      req.open("GET", url, true);
      req.onreadystatechange = function() {
        if (req.readyState === 4) {
          var _fileContents = req.responseText;
          // I really hope "with" is the right thing to do here. We seem to need
          // it in order to make globally-defined things work.
          with (lobby) { eval(_fileContents); }
          transporter.loadedURLs[url]();
          transporter.loadedURLs[url] = 'done';
        }
      };
      req.send();
    } else {
      var head = document.getElementsByTagName("head")[0];         
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.onload = function() {
        transporter.loadedURLs[url]();
        transporter.loadedURLs[url] = 'done';
      };
      script.src = url;
      head.appendChild(script);
    }
  }, {category: ['transporting']});

  add.method('fileIn', function (directory, name, scriptLoadedCallback) {
    var url = this.urlForModuleName(name, directory);
    
    transporter.module.onLoadCallbacks[name] = scriptLoadedCallback;

    this.loadJSFile(url, function() {
      var module = modules[name];
      if (!module) {
        // Must just be some external Javascript library - not one of our
        // modules. So onLoadCallbacks[name] won't have been called, so
        // let's just delete it from there and call it ourselves.
        delete transporter.module.onLoadCallbacks[name];
        if (scriptLoadedCallback) { scriptLoadedCallback(); }
      }
    });
  }, {category: ['transporting']});

  add.method('requires', function(moduleDir, moduleName, reqLoadedCallback) {
    if (! this._requirements) { this._requirements = []; }
    this._requirements.push([moduleDir, moduleName]);
    
    var module = transporter.module.existingOneNamed(moduleName);
    if (module) {
      // Make sure it's done loading.
      var url = this.urlForModuleName(module._name, module._directory);
      var urlLoadedCallback = transporter.loadedURLs[url];
      if (urlLoadedCallback === 'done') {
        if (reqLoadedCallback) { reqLoadedCallback(); }
      } else if (typeof(urlLoadedCallback) === 'function') {
        transporter.loadedURLs[url] = function() {
          urlLoadedCallback();
          if (reqLoadedCallback) { reqLoadedCallback(); }
        };
      } else {
        throw "Hmm, that's weird; why does the " + moduleName + " module exist when there's nothing in transporter.loadedURLs for it? urlLoadedCallback is " + urlLoadedCallback;
      }
    } else {
      transporter.module.fileIn(moduleDir, moduleName, reqLoadedCallback);
    }
  }, {category: ['requirements']});

  add.method('requirements', function(requirementsFunction, moduleBody) {
  }, {category: ['requirements']});

});

});
