lobby.transporter.module.create('string_extensions', function(thisModule) {


thisModule.addSlots(modules.string_extensions, function(add) {
    
    add.data('_directory', 'core');

});


thisModule.addSlots(lobby.String.prototype, function(add) {

  add.method('startsWithVowel', function () {
    return (/^[AEIOUaeiou]/).exec(this);
  }, {}, {});

  add.method('prependAOrAn', function () {
    return this.startsWithVowel() ? "an " + this : "a " + this;
  }, {}, {});

});


});
