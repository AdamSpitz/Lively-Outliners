lobby.transporter.module.create('string_buffer', function(thisModule) {


thisModule.addSlots(lobby, function(add) {

  add.creator('stringBuffer', {}, {category: ['core']}, {comment: 'Lets you append a whole bunch of strings and then join them all at once, so you don\'t get quadratic behavior.'});

});


thisModule.addSlots(lobby.stringBuffer, function(add) {

  add.method('create', function (initialString) {
    return Object.newChildOf(this, initialString);
  }, {}, {});

  add.method('initialize', function (initialString) {
    this.buffer = [];
    if (initialString != null) {this.append(initialString);}
  }, {}, {});

  add.method('append', function (string) {
    this.buffer.push(string);
    return this;
  }, {}, {});

  add.method('toString', function () {
    return this.buffer.join("");
  }, {}, {});

});


});