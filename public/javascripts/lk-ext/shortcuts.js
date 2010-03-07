// aaa - These should really not live in the global namespace.
// Maybe some of this is handled by the style/theme mechanism?

function defaultFillWithColor(c) {
  return new lively.paint.LinearGradient([new lively.paint.Stop(0, c),
                                          new lively.paint.Stop(1, c.lighter())],
                                         lively.paint.LinearGradient.SouthNorth);
}

function createTextField(readOnly, initialText, pos, extent) {
  pos = pos || pt(5, 10);
  extent = extent || pt(50,20);
  initialText = initialText || "";
  var tf = new TextMorph(pos.extent(extent), initialText);
  tf.acceptInput = !readOnly;
  tf.closeDnD();
  tf.setBorderWidth(0);
  tf.setFill(Color.white);
  return tf;
}

function createLabel(textOrFunction, pos, extent) {
  pos = pos || pt(5, 10);
  extent = extent || pt(50,20);
  var initialText = typeof textOrFunction === 'function' ? textOrFunction() : textOrFunction || "";
  var tf = new TextMorph(pos.extent(extent), initialText);
  tf.acceptInput = false;
  tf.closeDnD();
  tf.beLabel();
  tf.morphMenu = function(evt) {return null;};
  if (typeof textOrFunction === 'function') { tf.updateAppearance = tf.refreshText = function() {this.setText(textOrFunction());}; }
  return tf;
}

function createLabelledNode(text, n, helpText, container) {
  var m = (container || new RowMorph()).beInvisible();
  var lbl = createLabel(text + ": ");
  m.horizontalLayoutMode = LayoutModes.SpaceFill;
  m.replaceThingiesWith([lbl, n, createSpacer()]);
  m.labelMorph = lbl;
  m.labelledMorph = n;
  m.inspect = function() {return "a labelled node(" + text + ")";};
  m.helpText = helpText;
  return m;
}

function createButton(contents, f, padding) {
  var contentsMorph = (typeof contents === 'string' || typeof contents === 'function') ? createLabel(contents) : contents;
  var p = (padding != null) ? padding : 5;
  var b = new ButtonMorph(pt(0,0).extent(contentsMorph.bounds().extent().addXY(p * 2, p * 2)));
  b.addMorphAt(contentsMorph, pt(p, p));
  b.connectModel({model: {Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {f(createFakeEvent());}}}, setValue: "setValue", getValue: "getValue"});
  return b;
}

function createInputBox(getFunction, setFunction) {
  var m = new TextMorphRequiringExplicitAcceptance(pt(5, 10).extent(pt(140, 20)), "");
  m.closeDnD();
  m.setFill(null);
  m.getSavedText = getFunction;
  m.setSavedText = function(str) { if (str !== this.getSavedText()) { setFunction(str); } };
  m.refreshText();
  return m;
}

function createTextBoxWithButton(buttonText, textBoxText, f) {
  var m = new RowMorph();
  m.setPadding(0);
  m.setFill(Color.white);
  m.textBox = createTextField(false, textBoxText || "");
  m.replaceThingiesWith([m.textBox, createButton(buttonText, function() {f(m.textBox.getText());})]);
  m.inspect = function() {return "a text box with button(" + buttonText + ")";};
  return m;
}

function createCheckBoxWithImage(imageURL, size) {
  var image = new ImageMorph(size.extentAsRectangle(), imageURL);
  image.setFill(null);
  var button = new CheckBoxMorph(size, image);
  button.setFill(null);
  return button;
}

function createLeftJustifiedRow(ms, padding) {
  var row = new RowMorph().beInvisible();
  if (typeof(padding) !== 'undefined') { row.setPadding(padding); }
  row.horizontalLayoutMode = LayoutModes.SpaceFill;
  row.replaceThingiesWith(ms.concat([createSpacer()]));
  return row;
}

function createFakeEvent() {
  return {
    hand: WorldMorph.current().hands[0],
    isShiftDown: Functions.False,
    isForContextMenu: Functions.False,
  };
}
