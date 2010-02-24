// converting

function xmlDocFromString(s) {
  // I guess someday this'll have to be able to do it the IE way, too.
  return new DOMParser().parseFromString(s, "text/xml");
}

function stringFromXmlDoc(xmlDoc) {
  return new XMLSerializer().serializeToString(xmlDoc);
}


// creating XML/HTML nodes

function createNode(doc, tagName, attributes) {
  var n = doc.createElement(tagName);
  attributes.each(function(pair) {n.setAttribute(pair.key, pair.value);});
  return n;
}


// iterating through the XML

function eachNodeInGroup(rootNode, elementName, f) {
  $A(rootNode.getElementsByTagName(elementName + "s")).each(function(groupNode) {
    $A(groupNode.getElementsByTagName(elementName)).each(f);
  });
}



/**
 * Create a new Document object. If no arguments are specified,
 * the document will be empty. If a root tag is specified, the document
 * will contain that single root tag. If the root tag has a namespace
 * prefix, the second argument must specify the URL that identifies the
 * namespace.
 */
function newXMLDocument(rootTagName, namespaceURL) {
  if (!rootTagName) rootTagName = "";
  if (!namespaceURL) namespaceURL = "";
  if (document.implementation && document.implementation.createDocument) {
    // This is the W3C standard way to do it
    return document.implementation.createDocument(namespaceURL, rootTagName, null);
  }
  else { // This is the IE way to do it
    // Create an empty document as an ActiveX object
    // If there is no root element, this is all we have to do
    var doc = new ActiveXObject("MSXML2.DOMDocument");
    // If there is a root tag, initialize the document
    if (rootTagName) {
      // Look for a namespace prefix
      var prefix = "";
      var tagname = rootTagName;
      var p = rootTagName.indexOf(':');
      if (p != -1) {
        prefix = rootTagName.substring(0, p);
        tagname = rootTagName.substring(p+1);
      }
      // If we have a namespace, we must have a namespace prefix
      // If we don't have a namespace, we discard any prefix
      if (namespaceURL) {
        if (!prefix) prefix = "a0"; // What Firefox uses
      }
      else prefix = "";
      // Create the root element (with optional namespace) as a
      // string of text
      var text = "<" + (prefix?(prefix+":"):"") +  tagname +
          (namespaceURL
           ?(" xmlns:" + prefix + '="' + namespaceURL +'"')
           :"") +
          "/>";
      // And parse that text into the empty document
      doc.loadXML(text);
    }
    return doc;
  }
};
