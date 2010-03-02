lobby.transporter.module.create('string_extensions', function(thisModule) {


thisModule.addSlots(lobby.String.prototype, function(add) {

  add.method('startsWithVowel', function () {
    return (/^[AEIOUaeiou]/).exec(this);
  }, {}, {});

  add.method('prependAOrAn', function () {
    return this.startsWithVowel() ? "an " + this : "a " + this;
  }, {}, {});

});


});