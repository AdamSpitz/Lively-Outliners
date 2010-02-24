function Tester() {
}

Object.extend(Tester.prototype, {
  eachFunctionToRun: function(iterator) {
    for (var p in this) {
      if (p.startsWith("test")) {
        var f = this[p];
        if (typeof(f) == "function") {
          iterator(f.bind(this), p);
        }
      }
    }
  },

  run: function() {
    var testCount = 0;
    var failureCount = 0;
    var errorCount = 0;
    var className = this.constructor.type;

    this.eachFunctionToRun(function(f, testName) {
      testCount += 1;
      var fullTestName = className + "::" + testName;
      try {
        throwAwayNewStuffCreatedDuring(f);
      } catch (e) {
        if (e.isJsUnitException) {
          failureCount += 1;
          console.log(fullTestName + "(" + e.comment + ") assertion failed: " + e.jsUnitMessage + "\n" + e.stackTrace);
        } else {
          errorCount += 1;
          console.log(fullTestName + " had an error (" + e.sourceURL + ", line " + e.line + "): " + e.name + ", " + (e.message || e.description));
        }
      }
    }.bind(this));

    return [testCount, failureCount, errorCount];
  },
});

function runTesterClasses(testerClasses) {
  var testCount = 0;
  var failureCount = 0;
  var errorCount = 0;

  testerClasses.each(function(testerClass) {
    var results = new testerClass().run();
       testCount += results[0];
    failureCount += results[1];
      errorCount += results[2];
  });

  if (failureCount == 0 && errorCount == 0) {
    alert("Triumph! All " + testCount + " tests passed.");
  } else {
    alert("" + failureCount + " failures, " + errorCount + " errors (out of " + testCount + " tests in total). See the console for details.");
  }
}
