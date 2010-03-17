lobby.transporter.module.create('string_buffer', function(thisModule) {


thisModule.addSlots(modules.string_buffer, function(add) {
    
    add.data('_directory', 'core');

});


thisModule.addSlots(lobby, function(add) {

  add.creator('stringBuffer', {}, {category: ['core']}, {comment: 'Lets you append a whole bunch of strings and then join them all at once, so you don\'t get quadratic behavior.'});

});


thisModule.addSlots(stringBuffer, function(add) {

  add.method('create', function (initialString) {
    return Object.newChildOf(this, initialString);
  }, {category: ['creating']});

  add.method('initialize', function (initialString) {
    this.buffer = [];
    if (initialString !== undefined && initialString !== null) {this.append(initialString);}
  }, {category: ['creating']});

  add.method('append', function (string) {
    this.buffer.push(string);
    return this;
  }, {category: ['appending']});

  add.method('toString', function () {
    return this.buffer.join("");
  }, {category: ['converting']});

});


});
