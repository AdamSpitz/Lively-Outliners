Object.subclass("BatcherUpper", {
  initialize: function(f) {
    this.do_it = f;
    this.tried = false;
  },

  should_not_bother_yet: function() {
    if (this.dont_bother_yet) {
      this.tried = true;
      return true;
    } else {
      return false;
    }
  },

  dont_bother_until_the_end_of: function(f) {
    var old = this.dont_bother_yet;
    this.dont_bother_yet = true;
    f();
    this.dont_bother_yet = old;
    if (this.tried && !old) {
      this.tried = false;
      this.do_it();
    }
  },
});

Tester.subclass("BatcherUpperTester", {
  increment: function() {
    if (this.batcherUpper.should_not_bother_yet()) {return;}
    this.x += 1;
  },

  testBatching: function() {
    this.x = 0;
    this.batcherUpper = new BatcherUpper(this.increment.bind(this));
    this.batcherUpper.dont_bother_until_the_end_of(function() {
      this.increment();
      this.increment();
      this.increment();
    }.bind(this));
    assertEquals(1, this.x);
  },

  testNotCallingIfItsNotCalled: function() {
    this.x = 0;
    this.batcherUpper = new BatcherUpper(this.increment.bind(this));
    this.batcherUpper.dont_bother_until_the_end_of(function() {
    }.bind(this));
    assertEquals(0, this.x);
  },
});

