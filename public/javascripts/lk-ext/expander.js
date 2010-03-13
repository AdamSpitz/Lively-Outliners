ButtonMorph.subclass("ExpanderMorph", {
  initialize: function($super, expandee) {
    $super(pt(0, 0).extent(pt(12, 12)));
    var model = booleanHolder.containing(false);
    this.connectModel({model: model, getValue: "isChecked", setValue: "setChecked"});
    if (expandee) { model.notifier.add_observer(function() {this.updateExpandedness();}.bind(expandee)); }
    return this;
  },

  toggle: true,

  focusHaloBorderWidth: 0, // I don't like the halo

  changeAppearanceFor: function($super, value) {
    var baseColor = Color.blue; // Not sure how the LK style system works. -- Adam
    var vertices  = value ? [pt(0,0),pt(12,0),pt(6,12),pt(0,0)] : [pt(0,0),pt(12,6),pt(0,12),pt(0,0)];
    var direction = value ? lively.paint.LinearGradient.SouthNorth : lively.paint.LinearGradient.WestEast;
    var stops = [new lively.paint.Stop(0, baseColor          ),
                 new lively.paint.Stop(1, baseColor.lighter())];
    var gradient = new lively.paint.LinearGradient(stops, direction);
    var shape = new lively.scene.Polygon(vertices, Color.green, 1, Color.red); // I don't really understand what these colors do.
    this.setShape(shape);
    this.setFill(gradient);
    // $super(value); // Messes things up, I think. -- Adam
  },

   isExpanded: function( ) {return this.getModel().getValue();},
       expand: function( ) {this.setExpanded(true );},
     collapse: function( ) {this.setExpanded(false);},
  setExpanded: function(b) {if (!!this.isExpanded() !== !!b) {this.setModelValue("setValue", !!b); this.updateView("all");}},
});
