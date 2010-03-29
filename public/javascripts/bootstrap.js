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

// Gotta overwrite Prototype's Object.extend, or bad things happen with annotations.
Object.extend = function extend(destination, source) {
  for (var property in source) {
    if (property !== '__annotation__') {
      destination[property] = source[property];
    }
  }
  return destination;
};

var annotator = {
  annotationOf: function(o) {
    if (o.hasOwnProperty('__annotation__')) { return o.__annotation__; }
    var a = {slotAnnotations: {}};
    o.__annotation__ = a;
    return a;
  },

  annotationNameForSlotNamed: function(slotName) {
    // can't just use slotName because it leads to conflicts with stuff inherited from Object.prototype
    return "anno_" + slotName;
  },

  existingSlotAnnotation: function(holder, name) {
    if (! holder.hasOwnProperty('__annotation__')) { return null; }
    var holderAnno = holder.__annotation__;
    if (! holderAnno.slotAnnotations) { return null; }
    return holderAnno.slotAnnotations[annotator.annotationNameForSlotNamed(name)];
  },

  setSlotAnnotation: function(holder, name, slotAnnotation) {
    var holderAnno = annotator.annotationOf(holder);
    holderAnno.slotAnnotations[annotator.annotationNameForSlotNamed(name)] = slotAnnotation;
  },

  setCreatorSlot: function(annotation, name, holder) {
    annotation.creatorSlotName   = name;
    annotation.creatorSlotHolder = holder;
  },

  creatorChainLength: function(o) {
    if (o === lobby) { return 0; }
    if (! o.hasOwnProperty('__annotation__')) { return null; }
    var creatorSlotHolder = o.__annotation__.creatorSlotHolder;
    if (creatorSlotHolder === undefined) { return null; }
    return annotator.creatorChainLength(creatorSlotHolder) + 1;
  },
  
  adjustSlotsToOmit: function(rawSlotsToOmit) {
    var slotsToOmit = rawSlotsToOmit || [];
    if (typeof slotsToOmit === 'string') {
      slotsToOmit = slotsToOmit.split(" ");
    }
    slotsToOmit.push('__annotation__');
    return slotsToOmit;
  },

  copyDownSlots: function(dst, src, rawSlotsToOmit) {
    var slotsToOmit = annotator.adjustSlotsToOmit(rawSlotsToOmit);
    var dstAnno = annotator.annotationOf(dst);
    for (var name in src) {
      if (src.hasOwnProperty(name)) {
        if (! slotsToOmit.include(name)) {
          dst[name] = src[name];
          
          // Copy down the category (and maybe other stuff?).
          var srcSlotAnno = annotator.existingSlotAnnotation(src, name);
          if (srcSlotAnno && srcSlotAnno.category) {
            var dstSlotAnno = dstAnno.slotAnnotations[annotator.annotationNameForSlotNamed(name)] = {};
            dstSlotAnno.category = srcSlotAnno.category;
          }
        }
      }
    }
  }
};

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
      //console.log("OK, we seem to be done " + aaa_name + ". Here are the subguys: " + callbacks.map(function(cb) {return cb.aaa_name;}).join(', '));
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
annotator.setCreatorSlot(annotator.annotationOf(lobby.modules), 'modules', lobby);
annotator.setSlotAnnotation(lobby, 'modules', {category: ['transporter']});

lobby.transporter = {};
annotator.setCreatorSlot(annotator.annotationOf(lobby.transporter), 'transporter', lobby);
annotator.setSlotAnnotation(lobby, 'transporter', {category: ['transporter']});

lobby.transporter.loadedURLs = {};

lobby.transporter.module = {};
annotator.setCreatorSlot(annotator.annotationOf(lobby.transporter.module), 'module', lobby.transporter);

lobby.transporter.module.cache = {};

lobby.transporter.module.onLoadCallbacks = {};

lobby.transporter.module.named = function(n) {
  var m = lobby.modules[n];
  if (m) {return m;}
  //console.log("Creating module named " + n);
  m = lobby.modules[n] = Object.create(this);
  m._name = n;
  annotator.setCreatorSlot(annotator.annotationOf(m), n, lobby.modules);
  lobby.transporter.module.cache[n] = [];
  return m;
};

lobby.transporter.module.create = function(n, reqBlock, contentsBlock) {
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
    transporter.module.doneLoadingModuleNamed(n);
  }, n);
};

lobby.transporter.module.callWhenDoneLoadingModuleNamed = function(n, callback) {
  callback = callback || function() {};

  if (typeof(callback) !== 'function') { throw "What kind of callback is that? " + callback; }
  
  var existingOnLoadCallback = transporter.module.onLoadCallbacks[n];
  if (!existingOnLoadCallback) {
    transporter.module.onLoadCallbacks[n] = callback;
  } else if (typeof(existingOnLoadCallback) === 'function') {
    transporter.module.onLoadCallbacks[n] = function() {
      existingOnLoadCallback();
      callback();
    };
  } else if (existingOnLoadCallback === 'done') {
    // Already done; just call it right now.
    callback();
    return true;
  } else {
    throw "Whoa, what's wrong with the on-load callback? " + typeof(existingOnLoadCallback);
  }
  return false;
};

lobby.transporter.module.doneLoadingModuleNamed = function(n) {
  var onLoadCallback = transporter.module.onLoadCallbacks[n];
  if (typeof(onLoadCallback) === 'function') {
    transporter.module.onLoadCallbacks[n] = 'done';
    onLoadCallback();
  } else if (onLoadCallback === 'done') {
    // Fine, I think.
  } else {
    throw "Whoa, what's wrong with the on-load callback for " + n + "? " + typeof(onLoadCallback);
  }
};

lobby.transporter.module.slotAdder = {
  data: function(name, contents, slotAnnotation, contentsAnnotation) {
    if (! slotAnnotation) { slotAnnotation = {}; }
    this.holder[name] = contents;
    slotAnnotation.module = this.module;
    annotator.setSlotAnnotation(this.holder, name, slotAnnotation);
    if (contentsAnnotation) { // used for creator slots
      var a = annotator.annotationOf(contents);
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
          annotator.copyDownSlots(contents, cdp.parent, cdp.slotsToOmit);
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

transporter.module.callWhenDoneLoadingModuleNamed('bootstrap', function() {});
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
    scriptLoadedCallback = scriptLoadedCallback || function() {};

    // Don't load the same JS file more than once.
    var loadingStatus = transporter.loadedURLs[url];
    if (typeof loadingStatus === 'function') {
      transporter.loadedURLs[url] = function() {
        loadingStatus();
        scriptLoadedCallback();
      };
      return;
    } else if (loadingStatus === 'done') {
      return scriptLoadedCallback();
    } else if (loadingStatus) {
      throw "Wait, it's not a callback function and it's not 'done'; what is it?"
    }

    transporter.loadedURLs[url] = scriptLoadedCallback;

    // Intentionally using primitive mechanisms (either XHR or script tags), so
    // that we don't depend on having any other code loaded.
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

  add.method('fileIn', function (directory, name, moduleLoadedCallback) {
    var url = this.urlForModuleName(name, directory);
    
    if (transporter.module.callWhenDoneLoadingModuleNamed(name, moduleLoadedCallback)) { return; }

    this.loadJSFile(url, function() {
      var module = modules[name];
      if (!module) {
        // Must just be some external Javascript library - not one of our
        // modules. So we consider the module to be loaded now, since the
        // file is loaded.
        transporter.module.doneLoadingModuleNamed(name);
      }
    });
  }, {category: ['transporting']});

  add.method('requires', function(moduleDir, moduleName, reqLoadedCallback) {
    if (! this._requirements) { this._requirements = []; }
    this._requirements.push([moduleDir, moduleName]);

    reqLoadedCallback = reqLoadedCallback || function() {};

    var module = transporter.module.existingOneNamed(moduleName);
    if (module) {
      transporter.module.callWhenDoneLoadingModuleNamed(moduleName, reqLoadedCallback);
    } else {
      transporter.module.fileIn(moduleDir, moduleName, reqLoadedCallback);
    }
  }, {category: ['requirements']});

});

});
