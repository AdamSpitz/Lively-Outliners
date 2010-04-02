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
  objectAnnotationPrototype: {
    annotationNameForSlotNamed: function(name) {
      // can't just use the name because it leads to conflicts with stuff inherited from Object.prototype
      return "anno_" + name;
    },

    existingSlotAnnotation: function(name) {
      if (! this.slotAnnotations) { return null; }
      return this.slotAnnotations[this.annotationNameForSlotNamed(name)];
    },

    setSlotAnnotation: function(name, slotAnno) {
      var realSlotAnno = annotator.asSlotAnnotation(slotAnno);
      this.slotAnnotations[this.annotationNameForSlotNamed(name)] = realSlotAnno;
      return realSlotAnno;
    },

    slotAnnotation: function(name) {
      return this.existingSlotAnnotation(name) || this.setSlotAnnotation(name, {});
    },

    removeSlotAnnotation: function(name) {
      delete this.slotAnnotations[this.annotationNameForSlotNamed(name)];
    },

    setCreatorSlot: function(name, holder) {
      this.creatorSlotName   = name;
      this.creatorSlotHolder = holder;
    },

    copyDownSlots: function(dst, src, rawSlotsToOmit) {
      var slotsToOmit = annotator.adjustSlotsToOmit(rawSlotsToOmit);
      for (var name in src) {
        if (src.hasOwnProperty(name)) {
          if (! slotsToOmit.include(name)) {
            dst[name] = src[name];
            
            // Copy down the category (and maybe other stuff?).
            var srcSlotAnno = annotator.existingSlotAnnotation(src, name);
            if (srcSlotAnno && srcSlotAnno.category) {
              var dstSlotAnno = this.setSlotAnnotation(name, {});
              dstSlotAnno.category = srcSlotAnno.category;
            }
          }
        }
      }
    }
  },

  slotAnnotationPrototype: {
  },

  annotationOf: function(o) {
    var a = this.existingAnnotationOf(o);
    if (!a) { a = this.asObjectAnnotation({slotAnnotations: {}}); }
    o.__annotation__ = a;
    return a;
  },

  alreadyHasAnnotation: function(o) {
    return o.hasOwnProperty('__annotation__');
  },

  existingAnnotationOf: function(o) {
    if (this.alreadyHasAnnotation(o)) { return o.__annotation__; }
    return null;
  },

  asObjectAnnotation: function(anno) {
    // aaa - In browsers that don't allow you to set __proto__, create a new
    // object and copy over the slots.
    anno['__proto__'] = this.objectAnnotationPrototype;
    return anno;
  },

  asSlotAnnotation: function(slotAnno) {
    // aaa - In browsers that don't allow you to set __proto__, create a new
    // object and copy over the slots.
    slotAnno['__proto__'] = this.slotAnnotationPrototype;
    return slotAnno;
  },

  existingSlotAnnotation: function(holder, name) {
    var anno = this.existingAnnotationOf(holder);
    if (!anno) { return null; }
    return anno.existingSlotAnnotation(name);
  },

  creatorChainLength: function(o) {
    if (o === lobby) { return 0; }
    var anno = this.existingAnnotationOf(o);
    if (!anno) { return null; }
    var creatorSlotHolder = anno.creatorSlotHolder;
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
annotator.annotationOf(lobby.modules).setCreatorSlot('modules', lobby);
annotator.annotationOf(lobby).setSlotAnnotation('modules', {category: ['transporter']});

lobby.transporter = {};
annotator.annotationOf(lobby.transporter).setCreatorSlot('transporter', lobby);
annotator.annotationOf(lobby).setSlotAnnotation('transporter', {category: ['transporter']});

lobby.transporter.loadedURLs = {};

lobby.transporter.module = {};
annotator.annotationOf(lobby.transporter.module).setCreatorSlot('module', lobby.transporter);

lobby.transporter.module.cache = {};

lobby.transporter.module.onLoadCallbacks = {};

lobby.transporter.module.named = function(n) {
  var m = lobby.modules[n];
  if (m) {return m;}
  //console.log("Creating module named " + n);
  m = lobby.modules[n] = Object.create(this);
  m._name = n;
  annotator.annotationOf(m).setCreatorSlot(n, lobby.modules);
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
    annotator.annotationOf(this.holder).setSlotAnnotation(name, slotAnnotation);
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
          annotator.annotationOf(contents).copyDownSlots(contents, cdp.parent, cdp.slotsToOmit);
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
    var docURL = window.livelyBaseURL || document.documentURI;
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





thisModule.addSlots(transporter, function(add) {

  add.method('loadExternal', function(fileSpecs, callWhenDone) {
    if (fileSpecs.length === 0) { return callWhenDone(); }
    var dirAndName = fileSpecs.shift();
    transporter.module.fileIn(dirAndName[0], dirAndName[1], function() {
      transporter.loadExternal(fileSpecs, callWhenDone);
    });
  }, {category: ['bootstrapping']});

  add.method('createCanvasIfNone', function() {
    var canvas = document.getElementById("canvas");
    if (! canvas) {
      canvas = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
      canvas.setAttribute('id', 'canvas');
      canvas.setAttribute('width',  '800');
      canvas.setAttribute('height', '600');
      canvas.setAttribute('xmlns', "http://www.w3.org/2000/svg");
      canvas.setAttribute('xmlns:lively', "http://www.experimentalstuff.com/Lively");
      canvas.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
      canvas.setAttribute('xmlns:xhtml', "http://www.w3.org/1999/xhtml");
      canvas.setAttribute('xml:space', "preserve");
      canvas.setAttribute('zoomAndPan', "disable");
      var title = document.createElement('title');
      title.appendChild(document.createTextNode('Lively canvas'));
      canvas.appendChild(title);
      document.body.appendChild(canvas);
    }
    return canvas;
  }, {category: ['bootstrapping']});

  add.method('loadLivelyKernel', function(callWhenDone) {
    if (document.body) { this.createCanvasIfNone(); } else { window.onload = this.createCanvasIfNone; }

    // Later on could do something nicer with dependencies and stuff. For now,
    // let's just try dynamically loading the LK files in the same order we
    // loaded them when we were doing it statically in the .xhtml file.
    this.loadExternal([["prototype", "prototype"],
                       ["lk", "JSON"],
                       ["lk", "defaultconfig"],
                       ["", "local-LK-config"],
                       ["lk", "Base"],
                       ["lk", "scene"],
                       ["lk", "Core"],
                       ["lk", "Text"],
                       ["lk", "Widgets"],
                       ["lk", "Network"],
                       ["lk", "Data"],
                       ["lk", "Storage"],
                       ["lk", "Tools"],
                       ["lk", "TestFramework"],
                       ["lk", "jslint"]
                      ], callWhenDone);
  }, {category: ['bootstrapping']});

  add.method('startLivelyOutliners', function(callWhenDone) {
    transporter.loadLivelyKernel(function() {
      transporter.module.fileIn("transporter", "object_graph_walker", function() {
        CreatorSlotMarker.annotateExternalObjects(true, transporter.module.named('init'));
        
        transporter.module.fileIn("", "everything", function() {
          CreatorSlotMarker.annotateExternalObjects(true);
          Morph.suppressAllHandlesForever(); // those things are annoying
          reflect(window).categorizeUncategorizedSlotsAlphabetically(); // make the lobby outliner less unwieldy
          
          var canvas = document.getElementById("canvas");
          var world = new WorldMorph(canvas);
          world.displayOnCanvas(canvas);
          if (Global.navigator.appName == 'Opera') { window.onresize(); }
          world._application = livelyOutliners;
          new MessageNotifierMorph("Right-click the background to start", Color.green).ignoreEvents().showInCenterOfWorld(world);
          if (callWhenDone) { callWhenDone(); }
        });
      });
    });
  }, {category: ['bootstrapping']});

});


});
