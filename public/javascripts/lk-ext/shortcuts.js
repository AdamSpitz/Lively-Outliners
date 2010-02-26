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
  if (typeof textOrFunction === 'function') { tf.getRefreshedText = textOrFunction; }
  return tf;
}

function createLabelledNode(text, n, helpText, container) {
  var m = (container || new RowMorph()).beInvisible();
  var lbl = createLabel(text + ": ");
  m.addThingies([lbl, n]);
  m.labelMorph = lbl;
  m.labelledMorph = n;
  m.inspect = function() {return "a labelled node(" + text + ")";};
  m.helpText = helpText;
  return m;
}

function createLabelledPanel(text, helpText) {
  var controls = new ColumnMorph();
  controls.setFill(null);
  controls.beUngrabbable();
  controls.inspect = function() {return text + " panel controls";};
  return createLabelledNode(text, controls, helpText, new ColumnMorph());
}

function createButton(text, f, padding) {
  var label = createLabel(text);
  var p = (padding != null) ? padding : 5;
  var b = new ButtonMorph(pt(0,0).extent(label.bounds().extent().addXY(p * 2, p * 2)));
  b.addMorphAt(label, pt(p, p));
  b.connectModel({model: {Value: null, getValue: function() {return this.Value;}, setValue: function(v) {this.Value = v; if (!v) {f(createFakeEvent());}}}, setValue: "setValue", getValue: "getValue"});
  return b;
}

function createTextBoxWithButton(buttonText, textBoxText, f) {
  var m = new RowMorph();
  m.sPadding = 0;
  m.fPadding = 0;
  m.setFill(Color.white);
  m.textBox = createTextField(false, textBoxText || "");
  m.addThingies([m.textBox, createButton(buttonText, function() {f(m.textBox.getText());})]);
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

function createFakeEvent() {
  return {
    hand: WorldMorph.current().hands[0],
    isShiftDown: Functions.False,
    isForContextMenu: Functions.False,
  };
}
