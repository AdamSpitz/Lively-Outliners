lobby.transporter.module.create('toggler', function(thisModule) {



thisModule.addSlots(lobby, function(add) {

  add.creator('toggler', {}, {category: ['ui']});

});


thisModule.addSlots(toggler, function(add) {

  add.method('initialize', function(morphToUpdate, morphToShowOrHide) {
    this._morphToUpdate = morphToUpdate;
    this._morphToShowOrHide = morphToShowOrHide;
    this._valueHolder = booleanHolder.containing(false);
    this._valueHolder.add_observer(this.valueChanged.bind(this));
  });

  add.method('toggle', function(evt) { this._valueHolder.toggle(evt); });

  add.method('isOn', function() { return this._valueHolder.getValue(); });

  add.method('setValue', function(b, evt) { this._valueHolder.setValue(b, evt); });

  add.method('beOn', function(evt) { this.setValue(true, evt); });

  add.method('beOff', function(evt) { this.setValue(false, evt); });

  add.method('valueChanged', function(valueHolder, evt) {
    this._morphToUpdate.updateAppearance();
    if (this.isOn()) { this._morphToShowOrHide.wasJustShown(evt); }
  });

  add.method('shouldNotBeShown', function() { return ! this.isOn(); });

  add.method('actualMorphToShow', function() { return this._morphToShowOrHide; });

});



});