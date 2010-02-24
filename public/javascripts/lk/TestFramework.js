/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


/* An adhoc testFramework. It defines a TestCase class which should be subclassed for
creating own tests. TestResult and TestSuite are used internally for running the Tests.
TestRunner is a Widget which creates a standard xUnit TestRunner window. All tests of 
the system can be run from it */

/*
 * Related Work:
 * - http://www.cjohansen.no/en/javascript/test_driven_development_with_javascript_part_two
 */

module('lively.TestFramework').requires().toRun(function(thisModule) {

Object.subclass('TestCase', {

    shouldRun: true,
    
	initialize: function(testResult) {
		if (testResult) {
			this.result = testResult;	 
		} else {
			this.result = new TestResult();	   
		};
	},
	
	verbose: function() {
	    return true;
	},
	
	log: function(aString) {
        if (this.verbose())
            console.log(aString);
	},
	
	runAll: function() {
	    var startTime = (new Date()).getTime();	
		this.allTestSelectors().each(function(ea) {
			this.runTest(ea)
		}, this);
		this.result.setTimeToRun(this.name(), (new Date()).getTime() - startTime);
	},
	
	name: function() {
	    return this.constructor.type
	},
	
	setUp: function() {},
	
	tearDown: function() {},
	
	runTest: function(aSelector) {
	    if (!this.shouldRun) return;
		this.log('Running test: ' + aSelector);
		try {
			this.currentSelector = aSelector;
			// var startTimeTest = (new Date()).getTime();	
			this.setUp();
			this[aSelector]();
			this.result.addSuccess(this.constructor.type, aSelector);
			// this.log(' ++ succeeded ++ (' + ((new Date()).getTime() - startTimeTest) +"ms)" );
			// this.log(' ++ succeeded ++');
		} catch (e) {
			this.result.addFailure(this.constructor.type, aSelector, e);
			this.log(' -- failed -- ' + '(' + printError(e) + ')');
			//if (!e.isAssertion) throw e;
		} finally {
			try {
				this.tearDown();
			} catch(e) {
				this.log('Couldn\'t run tearDown for ' + aSelector + ' ' + printError(e));
			}
		}
	},
	
	debugTest: function(selector) {
		// FIXME
            lively.lang.Execution.installStackTracers();
	    this.runTest(selector);
            lively.lang.Execution.installStackTracers("uninstall");
	    return this.result.failed.last();
	},

    assert: function(bool, msg) {
        if (bool) return;
        msg = msg || "unknown";
        throw {isAssertion: true, message: " assert failed " + "(" + msg + ")"}
    },
        
	assertEqual: function(firstValue, secondValue, msg){
	    if (firstValue && firstValue.constructor === Point && secondValue &&
	        secondValue.constructor === Point && firstValue.eqPt(secondValue)) return;
		if (firstValue == secondValue) return;
		/* Better call assert() and assemble error message
		in AssertionError */
		throw {isAssertion: true, message: (msg ? msg	 : "") + " (" + firstValue +" != " + secondValue +") "};
	},
	
	assertIdentity: function(firstValue, secondValue, msg){
		if(!(firstValue === secondValue))  {
			/* Better call assert() and assemble error message
			in AssertionError */
			throw {isAssertion: true, message: (msg ? msg	 : "") + " (" + firstValue +" !== " + secondValue +") "};
		}
	},
	
	assertIdentity: function(firstValue, secondValue, msg){
		if(!(firstValue === secondValue))  {
			/* Better call assert() and assemble error message
			in AssertionError */
			throw {isAssertion: true, message: (msg ? msg	 : "") + " (" + firstValue +" !== " + secondValue +") "};
		}
	},
	
	assertEqualState: function(leftObj, rightObj, msg) {
        msg = (msg ? msg : ' ') + leftObj + " != " + rightObj + " because ";
		if (!leftObj && !rightObj) return;
		if (!leftObj || !rightObj) this.assert(false, msg);
		switch (leftObj.constructor) {
			case String:
			case Boolean:
			case Boolean:
			case Number: {
				this.assertEqual(leftObj, rightObj, msg);
				return;
			}
		};
		if (leftObj.isEqualNode) {
		    this.assert(leftObj.isEqualNode(rightObj), msg);
            return;
		};
		var cmp = function(left, right) {
			for (var value in left) {
				if (!(left[value] instanceof Function)) {
					// this.log('comparing: ' + left[value] + ' ' + right[value]);
					try {
					    this.assertEqualState(left[value], right[value], msg);
					} catch (e) {
                        // debugger;
					    throw e;
					}
				};
			};
		}.bind(this);
		cmp(leftObj, rightObj);
		cmp(rightObj, leftObj);		
	},

    assertIncludesAll: function(arrayShouldHaveAllItems, fromThisArray, msg) {
        fromThisArray.each(function(ea) {
            this.assert(arrayShouldHaveAllItems.include(ea), msg)
        }, this);
    },
    
	allTestSelectors: function() {
	    return this.constructor.functionNames().select(function(ea) {
	        return this.constructor.prototype.hasOwnProperty(ea) && ea.startsWith('test');
	    }, this);
	},
	
	toString: function($super) {
	    return $super() + "(" + this.timeToRun +")"
	},
	
});


Object.subclass('TestSuite', {
	initialize: function() {
		this.result = new TestResult();
		this.testsToRun = []
		
	},
	
	setTestCases: function(testCaseClasses) {
		// this.testCases = testCaseClasses.collect(function(ea) {
		// 	return new ea(this.result);
		// }, this);
		this.testCaseClasses = testCaseClasses
	},
	
	runAll: function() {
	    this.testClassesToRun = this.testCaseClasses;
	    this.runDelayed();
	},
	
	runDelayed: function() {
	    var testCaseClass = this.testClassesToRun.shift();
	    if (!testCaseClass) {
	        if (this.runFinished)
	            this.runFinished();
	        return
	    }
		var testCase = new testCaseClass(this.result)
	    if (this.showProgress)
	        this.showProgress(testCase);
        testCase.runAll();
        var scheduledRunTests = new SchedulableAction(this, "runDelayed", null, 0);
        WorldMorph.current().scheduleForLater(scheduledRunTests, 0, false);
	},	
});


Object.subclass('TestResult', {
	initialize: function() {
		this.failed = [];
		this.succeeded = [];
		this.timeToRun = {};
	},
	
	setTimeToRun: function(testCaseName, time) {
	    return this.timeToRun[testCaseName]= time
	},
	
	getTimeToRun: function(testCaseName) {
	    return this.timeToRun[testCaseName]
	},
	
	addSuccess: function(className, selector) {
		this.succeeded.push({
				classname: className,
				selector: selector});
	},
	
	addFailure: function(className, selector, error) {
		this.failed.push({
				classname: className,
				selector: selector,
				err: error,
				toString: function(){ return this.classname + "." + this.selector + " failed: " + this.err }});
	},
	
	runs: function() {
		if (!this.failed) 
			return 0; 
		return this.failed.length + this.succeeded.length;
	},
	
	toString: function() {
        return "[TestResult " + this.shortResult() + "]"
	},
	
	// not used, but can be useful for just getting a string
	printResult: function() {
		var string = 'Tests run: ' + this.runs() + ' -- Tests failed: ' + this.failed.length;
		string += ' -- Failed tests: \n';
		this.failed.each(function(ea) {
			string +=  ea.classname + '.' + ea.selector + '\n   -->' 
			    + ea.err.message +  '\n';
		});
		string += ' -- TestCases timeToRuns: \n';
		var self = this;
		var sortedList = $A(Properties.all(this.timeToRun)).sort(function(a,b) {
		    return self.getTimeToRun(a) - self.getTimeToRun(b)});
		sortedList.each(function(ea){
		   string +=  this.getTimeToRun(ea)  + " " + ea+ "\n"
		}, this);
		return string
	},
	
	shortResult: function() {
		if (!this.failed)
			return;
		var time = Object.values(this.timeToRun).inject(0, function(sum, ea) {return sum + ea});
		var msg = Strings.format('Tests run: %s -- Tests failed: %s -- Time: %ss',
			this.runs(), this.failed.length, time/1000);
		return  msg;
	},
	
	getFileNameFromError: function(err) {
	    if (err.sourceURL)
            return new URL(err.sourceURL).filename()
        else
            return "";
	},
	
	failureList: function() {
		var result = this.failed.collect(function(ea) {
			return ea.classname + '.' + ea.selector + '\n  -->' + ea.err.message  +
	            ' in ' + this.getFileNameFromError(ea.err) + 
	            (ea.err.line ? ' ( Line '+ ea.err.line + ')' : "");
		}, this);
		return result
	}
});

Widget.subclass('TestRunner', {

	viewTitle: "TestRunner",
	documentation: 'Just a simple Tool for running tests in the Lively Kernel environment',
	initialViewExtent: pt(600,500),
	formals: ['TestClasses', 'SelectedTestClass', 'ResultText', 'FailureList', 'Failure'],
	ctx: {},
	
	initialize: function($super, optTestModule) {
		$super(null);
		var model = Record.newPlainInstance((function(){var x={};this.formals.each(function(ea){x[ea]=null});return x}.bind(this))());
		this.onTestClassesUpdate = Functions.Null;
		this.onSelectedTestClassUpdate = Functions.Null;
		this.onResultTextUpdate = Functions.Null;
		this.onFailureListUpdate = Functions.Null;
		this.onFailureUpdate = Functions.Null;
		this.relayToModel(model, {TestClasses: 'TestClasses', SelectedTestClass: 'SelectedTestClass', ResultText: 'ResultText', FailureList: 'FailureList', Failure: 'Failure'});
		
		model.setTestClasses(optTestModule ?
			this.testClassesOfModule(optTestModule) :
			this.allTestClasses());

		return this;
	},
	
	runTests: function(buttonDown) {
		if (buttonDown) return;
		var testClassName = this.getSelectedTestClass();
		if (!testClassName) return;
		var testCase = new (Class.forName(testClassName))();
		testCase.runAll(this);
		this.setResultOf(testCase);
	},
	
	runAllTests: function(buttonDown) {
		if (buttonDown) return;
		var testSuite = new TestSuite();
		var counter = 0;
		//all classes from the list
		testSuite.setTestCases(this.getTestClasses().map(function(ea) {
		    return Class.forName(ea);
		}));
		var self = this;
		var total = self.resultBar.getExtent().x;
		var step = self.resultBar.getExtent().x / testSuite.testCaseClasses.length;
		// Refactor!
		testSuite.showProgress = function(testCase) {
		    self.setResultText(testCase.constructor.type);
		    self.resultBar.setExtent(pt(step*counter,  self.resultBar.getExtent().y));
		    var failureList = testSuite.result.failureList();
		    if(failureList.length > 0) {
		        self.setFailureList(failureList);
		        self.resultBar.setFill(Color.red);
		    };
		    counter += 1;
		};
		testSuite.runAll(this);
		testSuite.runFinished = function() {
	        self.setResultOf(testSuite);
		};
			
	},
		
	setResultOf: function(testObject) {
		this.testObject = testObject;
		this.setResultText(this.testObject.result.shortResult());
		this.setFailureList(this.testObject.result.failureList());
		this.setBarColor(this.testObject.result.failureList().length == 0 ? Color.green : Color.red);
		console.log(testObject.result.printResult());
		// updating list with timings
		this.setTestClasses(this.getTestClasses(),true);
	},

	testClassesOfModule: function(m) {
		return m.classes()
			.select(function(ea) { return ea.isSubclassOf(TestCase) && ea.prototype.shouldRun })
		    .collect(function(ea) { return ea.type })
		    .select(function(ea) { return !ea.include('Dummy') })
		    .select(function(ea) { return Config.skipGuiTests ? !ea.endsWith('GuiTest') : true })
            .sort();
	},

	allTestClasses: function() {
		return TestCase.allSubclasses()
		    .select(function(ea) { return ea.prototype.shouldRun })
		    .collect(function(ea) { return ea.type })
		    .select(function(ea) { return !ea.include('Dummy') })
		    .select(function(ea) { return Config.skipGuiTests ? !ea.endsWith('GuiTest') : true })
            .sort();
	},
	
	buildView: function(extent) {
		var panel = PanelMorph.makePanedPanel(extent, [
		   ['testClassList', newRealListPane, new Rectangle(0, 0, 1, 0.6)],
		   ['runButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0, 0.6, 0.5, 0.05)],
		   ['runAllButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.5, 0.6, 0.5, 0.05)],
		   ['resultBar', function(initialBounds){return new TextMorph(initialBounds)}, new Rectangle(0, 0.65, 1, 0.05)],
		   ['failuresList', newTextListPane, new Rectangle(0, 0.7, 1, 0.3)],
		]);

		var model = this.getModel();
		// necessary?
		var self = this;
		var testClassList = panel.testClassList;
		this.testClassListMorph = testClassList.innerMorph();
		this.testClassListMorph.itemPrinter = function(item) { 
		     var string = "";
		     if (self.testObject) {
		         var time = self.testObject.result.getTimeToRun(item);
		         if (time) string += "  ("+ time + "ms)";
		     }
             return  item.toString() + string ;
        };
		
		
		testClassList.connectModel(model.newRelay({List: '-TestClasses', Selection: '+SelectedTestClass'}), true);
		testClassList.innerMorph().focusHaloBorderWidth = 0;
	
		var runButton = panel.runButton;
		runButton.setLabel("Run Tests");
		runButton.connectModel({model: self, setValue: "runTests"});
		
		var runAllButton = panel.runAllButton;
		runAllButton.setLabel("Run All Tests");
		runAllButton.connectModel({model: self, setValue: "runAllTests"});
		
		// directly using the morph for setting the color -- 
		this.resultBar = panel.resultBar;
		this.resultBar.connectModel(model.newRelay({Text: '-ResultText'}));

		var failuresList = panel.failuresList;
		failuresList.connectModel(model.newRelay({List: '-FailureList', Selection: '+Failure'}));
		// quick hack for building stackList
		model.setFailure = model.setFailure.wrap(function(proceed, failureDescription) {
			// FIXME: put his in testResult
			proceed(failureDescription);
			if (!self.testObject) {
			    console.log('could not find my testObject :-(');
			    return;
			}
			var i = self.testObject.result.failureList().indexOf(failureDescription);
			self.openErrorStackViewer(self.testObject.result.failed[i]);
		});
		
		return panel;
		},
		
		setBarColor: function(color) {
		this.resultBar.setFill(color);
	},
	
	openErrorStackViewer: function(testFailedObj) {

	    if (!testFailedObj) return;
	    
		var testCase = new (Class.forName(testFailedObj.classname))();
		var failedDebugObj = testCase.debugTest(testFailedObj.selector);

		if (!failedDebugObj.err.stack) {
			console.log("Cannot open ErrorStackViewer: no stack");
			return;
		};
		
		new ErrorStackViewer(failedDebugObj).openIn(WorldMorph.current(), pt(220, 10));
	}
	
});

TestRunner.openIn = function(world, loc) {
    if (!world) world = WorldMorph.current();
    if (!loc) loc = pt(120, 10);
	new TestRunner().openIn(world, loc);
};

Widget.subclass('ErrorStackViewer', {

	defaultViewTitle: "ErrorStackViewer",
	defaultViewExtent: pt(450,350),
	
	initialize: function($super, testFailedObj) {
		$super();
		var list = [];	
		if(testFailedObj && testFailedObj.err && testFailedObj.err.stack) {
		    if(! testFailedObj.err.stack.each)
		        console.log("ErrorStackViewer: don't know what to do with" +testFailedObj.err.stack )
		    else
		        testFailedObj.err.stack.each(function(currentNode, c) { list.push(c.copyMe()) });
		};
		this.formalModel = Record.newInstance(
			{StackList: {}, MethodSource: {}, ArgumentsList: {}, SelectedCaller: {}},
			{StackList: list, MethodSource: "", ArgumentsList: [], SelectedCaller: null}, {});
		return this;
	},
	
	setStackList: function(list) {
        this.formalModel.setStackList(list)
	},
	
	buildView: function(extent) {
		var panel = PanelMorph.makePanedPanel(extent, [
			['callerList', newTextListPane, new Rectangle(0, 0, 1, 0.3)],
			['argumentsList', newTextListPane, new Rectangle(0, 0.3, 0.7, 0.2)],
			['inspectButton', function(initialBounds){return new ButtonMorph(initialBounds)}, new Rectangle(0.7, 0.3, 0.3, 0.2)],
			['methodSource', newTextPane, new Rectangle(0, 0.5, 1, 0.5)]
		]);
		
		var model = this.formalModel;
		
		var callerList = panel.callerList;
		callerList.connectModel({model: this, getList: "getCallerList", setSelection: "setCaller"});
		callerList.updateView("all");
		
		var argumentsList = panel.argumentsList;
		this.argumentsList = argumentsList;
		argumentsList.connectModel({model: model, getList: "getArgumentsList"});
		
		var inspectButton = panel.inspectButton;
		this.inspectButton = inspectButton;
		inspectButton.setLabel("Inspect");
		inspectButton.connectModel({model: this, setValue: "inspectCaller"});
		
		var methodSource = panel.methodSource;
		// FIXME
		this.methodSource = methodSource;
		methodSource.connectModel({model: model, getText: "getMethodSource"});
		
		formalModel = this.formalModel;
		var self = this;
		methodSource.innerMorph().boundEval = methodSource.innerMorph().boundEval.wrap(function(proceed, str) {
			console.log("eval " + str);
			try {
				var stackNode = formalModel.getSelectedCaller();
				var argNames = self.extractArgumentString(stackNode.method.toString());
				var source = "argFunc = function("+ argNames +") {return eval(str)}; argFunc";			
				return eval(source).apply(formalModel.getSelectedCaller().itsThis, stackNode.args); // magic...
			} catch(e) {
				console.log("Error in boundEval: " + e.toString())
				return ""
			}
		}); 

		return panel;
	},
	
	getCallerList: function() {
		return this.formalModel.getStackList().collect(function(ea) {
			var argsString = '---'
			var args = $A(ea.args);
			if (args.length > 0)
				argsString = '(' + args + ')';
			if(!(ea.method && ea.method.qualifiedMethodName))	
				return "no method found for " + printObject(ea);
				
			return ea.method.qualifiedMethodName() + argsString});
	},
	
	setCaller: function(callerString) {
		if (!callerString) return;
		var i = this.getCallerList().indexOf(callerString);
		var contextNode = this.formalModel.getStackList()[i];
		if (!contextNode) {
			this.formalModel.setMethodSource('Error: Can\'t find contextNode in stack!');
			this.methodSource.updateView("getMethodSource");
			return;
		}
		this.formalModel.setSelectedCaller(contextNode);
		this.formalModel.setMethodSource(contextNode.method.inspectFull());
		this.methodSource.updateView("getMethodSource");
		
		this.formalModel.setArgumentsList(this.getArgumentValueNamePairs(contextNode));
		this.argumentsList.updateView("getArgumentsList");
	},
	
	inspectCaller: function(value) {
		if (!value) return;
		var contextNode = this.formalModel.getSelectedCaller(contextNode);
		new SimpleInspector(contextNode).openIn(WorldMorph.current(), pt(200,10))
	},
	
	getArgumentValueNamePairs: function(stackNode) {
		var args = $A(stackNode.args);
		var argNames = this.getArgumentNames(stackNode.method.toString());
		console.log('Argnames: ' + args);
		var nameValues = argNames.inject([], function(nameValuePairs, eaArgName) {
			nameValuePairs.push(eaArgName + ': ' + args.shift());
			return nameValuePairs;
		});
		nameValues = nameValues.concat(args.collect(function(ea) {
			return 'unnamed: ' + ea;
		}));
		return nameValues;
	},
	
	extractArgumentString: function(methodSource) {
		var match =  /function.*?\((.*?)\)/.exec(methodSource);
		if (!match) {
			console.log("Error in extractArgumentString: " +methodSource);
			return ""
		};
		return match[1]
	},
	
	getArgumentNames: function(methodSrc) {
		var match =  /function.*?\((.*?)\)/.exec(methodSrc);
		if (!match) return [];
		var parameterString = match[1];
		return parameterString.split(", ").reject(function(ea) { return ea == '' });
	}
});
    
/* 
 * *** Error properties for documentation: ***
 *  Example from WebKit
 *    message:  assert failed (no files read), 
 *    line: 70
 *    expressionBeginOffset: 1765
 *    expressionEndOffset: 1836
 *    sourceId: 18326
 *    sourceURL: http://localhost/lk/kernel/TestFramework.js
 */

Global.printError = function printError(e) {
   var s = "";
   for (i in e) { s += i + ": " + String(e[i]) + ", "}; // get everything out....
   return s
}

Global.logError = function logError(e) {
    console.log("Error: " + printError(e));
}

Global.openStackViewer = function openStackViewer() {
   var stack = getStack();
   stack.shift();
   stack.shift();
   var stackList = stack.collect(function(ea){return {method: ea, args: []}});
   var viewer = new ErrorStackViewer();
   viewer.setStackList(stackList);
   var window = viewer.openIn(WorldMorph.current(), pt(220, 10));
   return window;
};

console.log("loaded TestFramework.js");

});