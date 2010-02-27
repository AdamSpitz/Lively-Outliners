// Just an experiment to see if I can get decent names.

var namesToIgnore = ['__annotation__'];
namesToIgnore.push('enabledPlugin'); // aaa just a hack for now - what's this clientInformation thing, and what are these arrays that aren't really arrays?

// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
function isDOMNode(o){
  return (
    typeof Node === "object" ? o instanceof Node : 
    typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  );
}
function isDOMElement(o){
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    typeof o === "object" && o.nodeType === 1 && typeof o.nodeName==="string"
  );
}

function shouldIgnoreObject(o) {
  if (isDOMNode(o) || isDOMElement(o)) { return true; } // the DOM is a nightmare, stay the hell away
  return false;
}

function annotateEverythingReachableFrom(currentObj, nesting) {
  console.log("Now at: " + reflect(currentObj).name());
  if (nesting > 10) {
    console.log("Nesting level is " + nesting + "; something might be wrong. Not going any deeper.");
    return;
  }

  for (var name in currentObj) {
    if (currentObj.hasOwnProperty(name) && ! namesToIgnore.include(name)) {
      var contents = currentObj[name];
      if (contents !== null) {
        var contentsType = typeof contents;
        if (contentsType === 'object' || contentsType === 'function') {
          if (contents.constructor !== Array) {
            if (! contents.hasOwnProperty('__annotation__')) { // not seen yet
              if (! shouldIgnoreObject(contents)) {
                setCreatorSlot(annotationOf(contents), name, currentObj);
                annotateEverythingReachableFrom(contents, nesting + 1);
              }
            }
          }
        }
      }
    }
  }
}
