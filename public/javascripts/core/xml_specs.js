Object.subclass("AbstractAttributeSpec", {
  initialize: function(attrName, attrType, attrDefault, nodeAttrName, fieldName) {
      this.attrName = attrName;
      this.attrType = attrType;
      this.attrDefault = attrDefault;
      this.nodeAttrName = nodeAttrName || attrName;
      this.explicitFieldName = fieldName;
  },

  beDerived: function() {this.derived = true; return this;},
  isDerived: function() {return this.derived;},

  // aaa - need a better name for this
  beLoadedSeparately: function() {this.loadedSeparately = true; return this;},
  isLoadedSeparately: function() {return this.loadedSeparately;},

  beOptional: function() {this.optional = true; return this;},
  isOptional: function() {return this.optional;},

  beLazilyCreated: function() {this.lazilyCreated = true; return this;},
  isLazilyCreated: function() {return this.lazilyCreated;},

  canBeChangedByTheClient: function() {return ! this.isDerived();},

  requiresIdentifier: function(functionThatReturnsTheRequiredIdentifier) {
    this.requiredIdentifier = functionThatReturnsTheRequiredIdentifier;
    return this;
  },

  getValue: function(object          ) { return eval("object.get__" + this.attrName + "();"        ); },
  setValue: function(object, newValue) {        eval("object.set__" + this.attrName + "(newValue);"); },

  getValueOrDefault: function(o) {
    var v = this.getValue(o);
    if (v == null || typeof(v) == "undefined") {v = this.attrDefault;} // aaa - I don't believe the typeof check is necessary; isn't undefined == null? Try it.
    return v;
  },

  setValueFromNode: function(o, xmlNode) {
    this.setValue(o, this.valueFromNode(xmlNode));
  },

  hasValueChanged: function(o1, o2) {
    var v1 = this.getValueOrDefault(o1);
    var v2 = this.getValueOrDefault(o2);
    if (! this.attrType.areValuesEqual(v1, v2)) {
      return this.attrName + "(" + Object.inspect(v1) + " != " + Object.inspect(v2) + ")";
    }
    return false;
  },

  setCurrentAndSavedValues: function(object, alreadyHadIt, newValue) {
    var memento = object.constructor.getOrCreateMementoFor(object);
    this.initializeFieldIfNecessary(memento);
    this.setValue(memento, newValue);
    if ((!alreadyHadIt) || this.isLazilyCreated()) { this.setValue(object, newValue); }
  },

  incorporateInto: function(object, xmlNode, alreadyHadIt) {
      if (this.attrType.shouldBeUpdatedRatherThanReplaced) {
        // Just update the object.
        var subpartToUpdate = this.attrType.subpartWithIdentifier(this.requiredIdentifier(), object);
        var subpartNode = this.matchingSubnode(xmlNode);
        if (subpartNode == null) {
          if (this.isOptional()) {
            return false;
          } else {
            throw("Hey, the " + this.attrName + " field is missing from the XML!");
          }
        } else {
          return this.attrType.incorporateNewInfoAboutObject(subpartToUpdate, subpartNode, alreadyHadIt);
        }
      } else {
        // Replace the object with the new one.
        var newValue = this.valueFromNode(xmlNode);
        this.setCurrentAndSavedValues(object, alreadyHadIt, newValue);
        return false;
      }
  },

  fieldName: function() {
    var n = this.explicitFieldName || this.attrName;
    return   n == "type"   ?  "aaa_type"  :   n;  // Using "type" causes bugs, because Javascript uses it. I think.
  },

  initializeFieldIfNecessary: function(object) {
    if (this.attrType.newField) {
      var fieldName = this.fieldName();
      var existingField = object[fieldName];
      if (existingField == null) {
        object[fieldName] = this.attrType.newField();
      }
    }
  },
});

AbstractAttributeSpec.subclass("AttributeSpec", {
  valueFromNode: function(xmlNode) {
    return this.attrType.referredToByAttribute(xmlNode, this.nodeAttrName);
  },

  appendXmlTo: function(xmlNode, object) {
    // aaa - Sometimes I think we pass a null in instead of a Topic. Not sure whether this null check should go here, or in getValue, or what.
    //       Oh, wait, this would be fixed if we used TopicRefs, huh?
    if (object == null) {return;}
    var attr = this.getValue(object);
    xmlNode.setAttribute(this.nodeAttrName, this.attrType.xmlAttributeStringFor(attr));
  },
});

AbstractAttributeSpec.subclass("SubpartSpec", {
  matchingSubnodes: function(xmlNode) {
    var ns = $A(xmlNode.getElementsByTagName(this.nodeAttrName));
    var idSpec = this.attrType.identifierSpec;
    if (idSpec && this.requiredIdentifier) {
      var rid = this.requiredIdentifier();
      ns = ns.select(function(n) { return idSpec.attrType.areValuesEqual(rid, idSpec.valueFromNode(n)); }.bind(this));
    }
    return ns;
  },

  matchingSubnode: function(xmlNode) {
    // I'm assuming there'll just be one; would it make any sense to generalize this to handle multiple ones?
    // Or at least throw an exception if there are multiple ones? -- Adam, Jan. 2009
    return this.matchingSubnodes(xmlNode)[0];
  },

  valueFromNode: function(xmlNode) {
    return this.attrType.referredToByNode(this.matchingSubnode(xmlNode), this.attrDefault);
  },

  appendXmlTo: function(xmlNode, object, reasonForSaving) {
    this.appendXmlForThisSubpartTo(xmlNode, this.getValue(object), reasonForSaving);
  },

  appendXmlForThisSubpartTo: function(xmlNode, subpart, reasonForSaving) {
    var n = this.createNode(xmlNode.ownerDocument, subpart);
    this.attrType.appendSubpartXmlTo(n, subpart);
    if (reasonForSaving) {n.setAttribute("reason_for_saving", reasonForSaving);}
    xmlNode.appendChild(n);
  },

  createNode: function(xmlDoc, subpart) {
    var n = xmlDoc.createElement(this.nodeAttrName);
    var idSpec = this.attrType.identifierSpec;
    if (idSpec) { idSpec.appendXmlTo(n, subpart); }
    return n;
  },
});

AbstractAttributeSpec.subclass("SubarraySpec", {
  initialize: function(attrName, elemType) {
    this.attrName = attrName;
    this.elemType = elemType;
    this.elemSpec = new SubpartSpec(this.elemType.xmlTagName(), elemType);
    this.attrType = new ArrayType(elemType);
  },

  incorporateInto: function(object, xmlNode, alreadyHadIt) {
    var saved_items = [];
    this.setValue(object.constructor.getOrCreateMementoFor(object), saved_items);
    if (!alreadyHadIt) {this.elemType.removeAllFrom(object);}
    $A(xmlNode.getElementsByTagName(this.elemType.xmlTagName())).each(function(node) {
      var saved_item = this.elemType.createMementoFromNode(node);
      saved_items.push(saved_item);
      if (!alreadyHadIt) {
        this.elemType.createACopy(object, saved_item);
      }
    }.bind(this));
  },

  appendXmlTo: function(xmlNode, object) {
    $A(this.getValue(object)).each(function(elem) {
      this.elemSpec.appendXmlForThisSubpartTo(xmlNode, elem);
    }.bind(this));
  },
});


Object.subclass("ArrayType", {
  initialize: function(elemType) {
    this.elemType = elemType;
  },

  areValuesEqual: function(a1, a2) {
    if ((a1 != null && a2 == null) || (a2 != null && a1 == null)) {return false;}
    if ($A(a1).size() != $A(a2).size()) {return false;}
    // Um, this looks stupidly inefficient. Was I just experimenting with the zip function, or what? -- Adam, Jan. 2009
    var pairs = a1.zip(a2);
    for (var i = 0, n = pairs.size(); i < n; ++i) {
      var pair = pairs[i];
      if (! pair[1].equals(pair[0])) {return false;}
    }
    return true;
  },

  newField: function() {
    return new ValueHolder([]);
  },
});



CompositeObject = {
  eachSpec: function(f) {
    this.xmlSpecs.each(f);
  },

  eachSpecForChangeableField: function(f) {
    this.eachSpec(function(s) {if (s.canBeChangedByTheClient()) {f(s);}});
  },

  eachSpecForLoadableField: function(f) {
    this.eachSpec(function(s) {if (! s.isLoadedSeparately()) {f(s);}});
  },

  incorporateNewInfoAboutObject: function(object, xmlNode, alreadyHadIt) {
    this.eachSpecForLoadableField(function(s) {
      s.incorporateInto(object, xmlNode, alreadyHadIt);
    });
  },

  attributesOrSubpartsHaveChanged: function(o1, o2) {
    var reason = null;
    this.eachSpecForChangeableField(function(s) {
      if (!reason) {reason = s.hasValueChanged(o1, o2);}
    });
    return reason;
  },

  appendSubpartXmlTo: function(node, subpart) {
    this.eachSpecForChangeableField(function(s) {s.appendXmlTo(node, subpart);});
  },


  // creating mementos to remember what information is already saved

  createEmptyMemento: function() {
    var m = Object.extend({}, this.traitsIn(AbstractTraits));
    this.eachSpecForChangeableField(function(s) { s.initializeFieldIfNecessary(m); });
    return m;
  },

  createMementoFromNode: function(node) {
    var m = this.createEmptyMemento();
    this.eachSpecForChangeableField(function(s) {s.setValueFromNode(m, node);});
    return m;
  },

  getOrCreateMementoFor: function(object) {
    return object.saved || (object.saved = this.createEmptyMemento());
  },
};



function recordSpecs(o, specs) {
  Object.extend(o, CompositeObject);
  Object.extend(o, specs);
}
