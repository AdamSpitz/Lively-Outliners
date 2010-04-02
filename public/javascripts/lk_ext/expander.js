ButtonMorph.subclass("ExpanderMorph", {
  initialize: function($super, expandee) {
    $super(pt(0, 0).extent(pt(12, 12))); // aaa - should fix ButtonMorph so that its initial shape doesn't have to be a rectangle
    var model = booleanHolder.containing(false);
    this.connectModel({model: model, getValue: "isChecked", setValue: "setChecked"});
    if (expandee) { model.notifier.add_observer(function() {this.updateExpandedness();}.bind(expandee)); }
    return this;
  },

  toggle: true,
  styleClass: ['button', 'expander'],

  focusHaloBorderWidth: 0, // I don't like the halo

  getHelpText: function() { return (this.isExpanded() ? 'Collapse' : 'Expand') + ' me'; },

  verticesForValue: function(value) {
    return value ? [pt(0,0),pt(12,0),pt(6,12),pt(0,0)] : [pt(0,0),pt(12,6),pt(0,12),pt(0,0)];
  },

  changeAppearanceFor: function($super, value) {
    var baseColor = baseColorOf(this.getFill());
    var direction = value ? lively.paint.LinearGradient.SouthNorth : lively.paint.LinearGradient.WestEast;
    var stops = [new lively.paint.Stop(0, baseColor          ),
                 new lively.paint.Stop(1, baseColor.lighter())];
    var gradient = new lively.paint.LinearGradient(stops, direction);
    if (this.shape.setVertices) {
      this.shape.setVertices(this.verticesForValue(value));
    } else {
      var oldStyle = this.makeStyleSpec();
      this.setShape(new lively.scene.Polygon(this.verticesForValue(false)));
      this.applyStyle(oldStyle); // workaround for ButtonMorphs having to start off being a rectangle
    }
    this.setFill(gradient);
    // $super(value); // Messes things up, I think. -- Adam
  },

   isExpanded: function( ) {return this.getModel().getValue();},
       expand: function( ) {this.setExpanded(true );},
     collapse: function( ) {this.setExpanded(false);},
  setExpanded: function(b) {if (!!this.isExpanded() !== !!b) {this.setModelValue("setValue", !!b); this.updateView("all");}}
});

// Not sure I like this, but for now I think I want expanders to look different from regular buttons.
WorldMorph.prototype.displayThemes.primitive.expander = {fill: Color.blue.lighter()};
WorldMorph.prototype.displayThemes.lively   .expander = {fill: Color.blue};
WorldMorph.prototype.displayThemes.turquoise.expander = {fill: Color.turquoise};
