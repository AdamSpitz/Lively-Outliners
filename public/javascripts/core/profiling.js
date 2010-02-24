function profile_info(s) {
  if (debugMode) {
    console.log("profile_info: " + s);
  }
}

function profile_times(desc, ts) {
  if (debugMode) {
    var s = new StringBuffer();
    s.append(desc).append(": ");
    for (var i = 0; i < ts.size() - 1; ++i) {
      if (i > 0) {s.append(", ");}
      s.append(ts[i+1] - ts[i]);
    }
    profile_info(s.toString());
  }
}

Object.subclass("Profiler", {
  initialize: function(desc) {
    this.desc = desc;
    this.times = [];
    this.record_time();
  },

  record_time: function() {
    this.times.push(new Date().getTime());
  },

  done: function() {
    this.record_time();
    profile_times(this.desc, this.times);
  },
});


MockProfiler = {
  initialize: function(desc) {},
  record_time: function() {},
  done: function() {},
};

function new_method_profiler(desc) {
  if (debugMode) {
    return new Profiler(desc);
  } else {
    return MockProfiler;
  }
}



Object.subclass("Stats", {
  initialize: function(desc) {
    this.desc = desc;
    this.hash = new Hash();
    this.record_time();
  },

  increment: function(s, inc) {
    var v = this.hash.get(s);
    var n = (v || 0) + (inc || 1);
    this.hash.set(s, n);
    return n;
  },

  record_time: function(s) {
    var t1 = this.most_recent_recorded_time;
    var t2 = new Date().getTime();
    if (t1 && s) {this.increment(s, t2 - t1);}
    this.most_recent_recorded_time = t2;
  },

  print_all: function() {
    var s = new StringBuffer();
    s.append("Stats (").append(this.desc).append("):");
    this.hash.each(function(pair) {
      s.append("\n").append(pair.key).append(": ").append(pair.value);
    });
    console.log(s.toString());
  },
});

MockStats = {
  initialize: function(desc) {},
  increment: function(s, inc) {},
  record_time: function(s) {},
  print_all: function() {},
};

function new_stats(desc) {
  if (debugMode) {
    return new Stats(desc);
  } else {
    return MockStats;
  }
}

var stats = new_stats("Global");

function current_stats() {return stats;}
