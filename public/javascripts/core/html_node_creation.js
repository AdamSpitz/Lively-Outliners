// Little utility functions for creating nodes

function createLinkToFunction(text, f) {
  var b = document.createElement('a');
  b.href = "#";
  b.onclick = f;
  b.appendChild(document.createTextNode(text));
  return b;
}

function createLinkToURL(text, url) {
  var b = document.createElement('a');
  b.href = url;
  b.appendChild(document.createTextNode(text));
  return b;
}

var LabelTraits = {
  getText: function()  {return this.data;},
  setText: function(t) {this.data = t;},
};

function createLabel(text) {
  var label = document.createTextNode(text);
  Object.extend(label, LabelTraits);
  return label;
}

function createLabelledNode(text, n) {
  var p = document.createElement('p');
  p.appendChild(createLabel(text + ": "));
  p.appendChild(n);
  return p;
}

var TextFieldTraits = {
  getText: function()  {return this.value;},
  setText: function(t) {this.value = t;},
};

function createTextField(readOnly, initialText) {
  var tf = document.createElement("input");
  tf.readOnly = readOnly;
  Object.extend(tf, TextFieldTraits);
  if (initialText != null) {tf.setText(initialText);}
  return tf;
}

function createElementWithChildren(tagName, children) {
  var e = document.createElement(tagName);
  for (var i = 0, n = children.length; i < n; ++i) {e.appendChild(children[i]);}
  return e;
}

function createLabelledTable(n, labelText, shouldHaveAddFunction, addFunction, addFunctionButtonText) {
  var div = document.createElement('div');
  div.appendChild(               document.createTextNode(labelText));
  div.appendChild(o.topicNames = document.createElement("table")     );  // aaaaaaaaaaa - Whoa, this line looks broken. Why hard-code topicNames?
  if (shouldHaveAddFunction) {
    div.appendChild(createLinkToFunction(addFunctionButtonText, function() {addFunction(this.parentNode.parentNode); return false;}));
  }
  return div;
}

function removeAllChildNodes(n) {
  var c;
  while (c = n.childNodes[0]) {n.removeChild(c);}
}
