module('lively.Tests.TestFrameworkTests').requires('lively.TestFramework').toRun(function() {

/* These tests are used for testing the test framework itself 
TestCase, TestResult, and TestSuite are tested */

TestCase.subclass('DummyTestCase', {
    testGreen1: function() {this.assert(true);},
	testGreen2: function() {},
	testRed: function() { this.assert(false, 'dummyMessage'); }
});

TestCase.subclass('DummyTestCase1', { testGreenTest1: function() { this.assert(true); } });
TestCase.subclass('DummyTestCase2', { testGreenTest2: function() { this.assert(true); } });
TestCase.subclass('DummyTestCase3', { testRedTest1: function() { this.assert(false); } });

/**
 * @class TestTestCase
 * Tests the TestCase class
 */
TestCase.subclass('TestTestCase', {
	setUp: function() {
		this.setUpWasRun = true;
	},
	
	testWasRun: function() {
		this.wasRun = true;
	},
	
	testAssertFails: function() {
        try {
            this.assert(false, 'This should fail');
        } catch(e) {
            return;
        };
        // Not really tests the assert...
        this.assert(false);
	},
	
	testRunSetUp: function() {
	    this.log(this.setUpWasRun);
	    this.assert(this.setUpWasRun, 'setUp method was not invoked');
	},
	
	testAssertFailsNot: function() {
		this.assert(true, 'This should not fail');
    },

    testAssertEqualFails: function() { 
        try {
            this.assertEqual(3,4, 'This should fail');
	    } catch(e) {
	        return;
	    };
	    this.assert(false);
	},

    testAssertEqualFailsNot: function() {
		this.assertEqual(3,3, 'This should not fail');
	},

    testAssertIndentityFails: function() { 
        try {
            var o1 = {};
            var o2 = {};
            this.assertIdentity(o1,o2, 'This should fail');
	    } catch(e) {
	        return;
	    };
	    this.assert(false);
	},
	
    testAssertEqualIdentityNot: function() {
        var o = {};
		this.assertEqual(o,o, 'This should not fail');
	},

	testAssertEqualState: function() {
		this.assertEqualState({a: 123, b: 'xyz'}, {a: 123, b: 'xyz'});
	},
	
	testAssertEqualStateFails: function() {
		try {
			this.assertEqualState([], [{a: 123, b: 'xyz'}]);
		} catch(e) {
			if (e.isAssertion) return;
		};
		this.assert(false, 'State of objects are not equal!');
	},
	
	testAssertIncludesAll: function() {

		try { this.assertIncludesAll([1,2,3], [1,2,3]) } catch(e) {
		    if (e.isAssertion)
		        this.assert(false, '[1,2,3], [1,2,3]')
		    else throw e
		};
		try { this.assertIncludesAll([1,2,3], [1,2]) } catch(e) {this.assert(false, '[1,2,3], [1,2]')};
		
		var asserted = false
		try { this.assertIncludesAll([1,2], [1,2,3]) } catch(e) {if (e.isAssertion) asserted = true};
		if (!asserted) this.assert(false, 'assertIncludesAll([1,2], [1,2,3]) was successful');
		
		asserted = false
		try { this.assertIncludesAll([1,2,9], [1,2,3]) } catch(e) {if (e.isAssertion) asserted = true};
		if (!asserted) this.assert(false, 'assertIncludesAll([1,2], [1,2,3]) was successful');
	},
	
	testTearDown: function() {
        var counter = 0;
        // Use a existing DummyClass...!
        TestCase.subclass('DummyTearDownTestCase', {
            test1: function() {},
            test2: function() {},
            tearDown: function() {counter += 1},
        });
        new DummyTearDownTestCase().runAll();
        this.assertEqual(counter, 2);
	},
	
	testDonCatchErrors: function() {
        TestCase.subclass('DummyTestCatchError', {
            test1: function() {throw Error},
        });
        try {
            new DummyTestCatchError().runAll();
            this.assert(false, "should not get here");
        } catch (e) {
            this.assert(true, "should get here")
        };
	},
	
	testDonRunTestsInTestClassesWhichDoNotWant: function() {
        var notCalled = true;
        // Use a existing DummyClass...!
        TestCase.subclass('DummyDontRunTestCase', {
            shouldRun: false,
            test1: function() { notCalled = false },
        });
        new DummyDontRunTestCase().runAll();
        this.assert(notCalled);
        new DummyDontRunTestCase().runTest('test1');
        this.assert(notCalled);
	},
	
	testTestSelectorsDontIncludeInherit: function() {
        var notCalled = true;
        // Use a existing DummyClass...!
        TestCase.subclass('Dummy1', { test1: function() {} });
        Dummy1.subclass('Dummy2', { test2: function() {} });
        this.assertEqualState(new Dummy2().allTestSelectors(), ['test2']);
	},
	
});

/**
 * @class TestResultTest
 */
TestCase.subclass('TestResultTest', {
	setUp: function() {
        this.dummyTestCase = new DummyTestCase();
	},

    testDummyIsThere: function() {
        this.assert(this.dummyTestCase);
    },
    
    testResultForOneSucceedingTest: function() {
        var greenTestSel = 'testGreen1';
        this.dummyTestCase.runTest(greenTestSel);
        var result = this.dummyTestCase.result;
        this.assertEqual(result.runs(), 1);
        this.assertEqual(result.succeeded.first().selector, greenTestSel);
        this.assertEqual(result.succeeded.first().classname, 'DummyTestCase');
    },
    
    testResultForTwoSucceedingTest: function() {
        this.dummyTestCase.runTest('testGreen1');
        this.dummyTestCase.runTest('testGreen2');;
        this.assertEqual(this.dummyTestCase.result.runs(), 2);
    },
    
    testResultForFailingTest: function() {
        var redTestSel = 'testRed';
        this.dummyTestCase.runTest(redTestSel);
        var result = this.dummyTestCase.result;
        this.assertEqual(this.dummyTestCase.result.runs(), 1);
        this.assertEqual(result.failed.first().selector, redTestSel);
        this.assertEqual(result.failed.first().classname, 'DummyTestCase');
    },
    
    testStringRepresentation: function() {
        this.dummyTestCase.runAll();
        var result = this.dummyTestCase.result;
        this.assert(result.shortResult().startsWith('Tests run: 3 -- Tests failed: 1 -- Time:'));
        this.assertEqual(result.failureList().length, 1);
        this.assert(result.toString(), "toString failed");
        this.assert(result.printResult(), "printResult failed");
    },
    
    
});

/**
 * @class TestSuiteTest
 */
// Todo: implement async testing to be able to test that
// TestCase.subclass('TestSuiteTest', {
//  testRunAll: function() {
//      ts = new TestSuite();
//      ts.setTestCases([DummyTestCase1, DummyTestCase2, DummyTestCase3]);
//      ts.runAll();
//      this.assertEqual(ts.result.runs(), 3, 'result');
//  }
// });

TestCase.subclass('RememberStackTest', {
	
	shouldRun: false,
	
	a: function(a, b, c) {
		this.assert(false);
	},
	
	b: function(parameter) {
		throw new Error();
	},
	
	dummyTest: function() {
		console.log("dummy: " + getCurrentContext());
		this.a(1, 2, 3);
	},
	
	myFailure: function() {
		this.a(1, 2, 3, ['a', 'b', 'c']);
	},
	
    // testError: function() {
    //         new FabrikComponent().buildView();
    //          this.a(1, 2, ['a', 'b', 'c']);
    //     },
	
	myError: function() {
		this.b(1);
	},
	
	// testOpenStackViewer: function() {
	// 	Config.debugExtras = true;
	// 	var result = this.debugTest("testError");
	// 	new StackViewer(this, result.err.stack).openIn(WorldMorph.current(), pt(1,1));
	// 	Config.debugExtras = false;
	// },
	
	testReturnCurrentContextWhenFail: function() {
		var testCase = new this.constructor();
		var originalSource = testCase.a.toString();
		//root = Function.trace(this.dummyTest());
		var error = testCase.debugTest("dummyTest");
		
		this.assert(error.err.stack, "Failed to capture currentContext into assertion.stack");
		this.assertEqual(error.err.stack.caller.method.qualifiedMethodName(), "RememberStackTest.a");
		
		this.assert(testCase.a.toString() == originalSource, "Functions are not unwrapped");
	},
	
	testGetArgumentNames: function() {
		var errorStackViewer = new ErrorStackViewer();
		var result = errorStackViewer.getArgumentNames(this.a.toString());
		this.assertEqual(result.length, 3);
		this.assertEqual(result[0], 'a');
		this.assertEqual(result[1], 'b');
		this.assertEqual(result[2], 'c');
	},
	
	testGetArgumentNames2: function() {
		var errorStackViewer = new ErrorStackViewer();
		var result = errorStackViewer.getArgumentNames(this.myError.toString());
		this.assertEqual(result.length, 0);
	},
	
	testGetArgumentValueNamePairs: function() {
		var testCase = new this.constructor();
		var testResult = testCase.debugTest("myError");
		
		var errorStackViewer = new ErrorStackViewer();
		var result = errorStackViewer.getArgumentValueNamePairs(testResult.err.stack);
		this.assertEqual(result.length, 1);
		this.assertEqual(result[0], 'parameter: 1');
	},
	
	testGetArgumentValueNamePairsForMethodWithUnnamedParameters: function() {
		var testCase = new this.constructor();
		var testResult = testCase.debugTest("myFailure");
		
		var errorStackViewer = new ErrorStackViewer();
		// testResult.err.stack is the assertion, so use caller
		var result = errorStackViewer.getArgumentValueNamePairs(testResult.err.stack.caller);
		console.log('Result: ' + result);
		this.assertEqual(result.length, 4);
		this.assertEqual(result[0], 'a: 1');
	},
	
	testGetArgumentValueNamePairsForMethodWithUnnamedParameters: function() {
		var testCase = new this.constructor();
		var testResult = testCase.debugTest("myError");
		
		var errorStackViewer = new ErrorStackViewer();
		// testResult.err.stack is the assertion, so use caller
		var result = errorStackViewer.getArgumentValueNamePairs(testResult.err.stack.caller);
			console.log('Result: ' + result);
		this.assertEqual(result.length, 0);
	}
});


TestCase.subclass('ErrorStackViewerTest', {
	
	shouldRun: false,
	
	setUp: function() {
		this.viewer = new ErrorStackViewer();
	},
	
	testExtractArgumentString: function() {
		this.assertEqual(this.viewer.extractArgumentString("function () { }"), "");
		this.assertEqual(this.viewer.extractArgumentString("function (a, b) { }"), "a, b");
		this.assertEqual(this.viewer.extractArgumentString("function foobar (a, b) { }"), "a, b");
	}
});

Object.subclass('StackDummy', {
	
	a: function(parameter) {
	    console.log("a callee: " + arguments.callee)
	    console.log("a callee.caller: " + arguments.callee.caller)
	    console.log("a callee.caller.caller: " + arguments.callee.caller.caller)
	    console.log("a callee.caller.caller.caller: " + arguments.callee.caller.caller.caller)
        return parameter + 1;
	},
	
	b: function(parameter) {
        return this.a(parameter) + 1
	},

	c: function(parameter) {
        return this.b(parameter) + 1		
	},
	
	d: function(parameter) {
        return this.c(parameter) + 1		
	},
});

function stackTestFunctions(){

function a(parameter) {
    for(p in arguments.callee.caller){
        this.console.log("P:" + p)
    };
    // logStack();
    return arguments;
};

function b(parameter) {
    return a(1,2,3)
};

c = function(parameter) {
    return b()		
};

d = function(parameter) {
    return c()	
};

function dummyRecurse(a) {
    if (a < 0 ) {
        // logStack();
        return 1
    } else {
        return dummyRecurse(a - 1) * a
    }
};
} //stackTestFunctions


TestCase.subclass('NativeStackTest', {
    
    shouldRun: true,
    
    testGetStack: function() {
        var stack = getStack();
        this.assert(stack.length > 1);
           
    },

    testOpenStackViewer: function() {
        this.window = openStackViewer();
    },
    
    tearDown: function() {
        if(this.window) this.window.remove();
    },
});


console.log('loaded TestFrameworkTests.js');

}) // end of module