Object.subclass("PeriodicalExecuter", {
  initialize: function(callback, frequency, shouldNotStartImmediately) { // shouldNotStartImmediately added by Adam, Jan. 2009
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    if (!shouldNotStartImmediately) {this.registerCallback();}
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  execute: function() {
    this.callback(this);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.execute();
      } finally {
        this.currentlyExecuting = false;
      }
    }
  },

  // Added by Adam, June 2008
  changeFrequency: function(frequency) {
    if (frequency == this.frequency) return;
    this.frequency = frequency;
    if (!this.isRunning()) return;
    this.stop();
    this.start();
  },

  // Added by Adam, August 2008
  stopDuring: function(f) {
    if (this.isRunning()) {
      var result = null;
      this.stop();
      try {
        result = f();
      } finally {
        this.registerCallback();
      }
      return result;
    } else {
      return f();
    }
  },

  // Added by Adam, Jan. 2009
  start: function() {this.registerCallback();},
  ensureRunning: function() {if (! this.isRunning()) {this.start();}},
  isRunning: function() {return this.timer != null;},
});

Object.extend(PeriodicalExecuter, {
  createButDontStartYet: function(callback, frequency) {return new PeriodicalExecuter(callback, frequency, true);},
});
