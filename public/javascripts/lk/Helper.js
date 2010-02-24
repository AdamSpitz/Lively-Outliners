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


module('lively.Helper').requires().toRun(function() {

// this.getRichText().asMorph().openInWorld()

/*
 * Stack Viewer when Dans StackTracer is not available
 */

Global.getStack = function() {
    var result = [];
    for (var caller = arguments.callee.caller; caller; caller = caller.caller) {
        if (result.indexOf(caller) != -1) {
           result.push({name: "recursive call can't be traced"});
           break;
        }
        result.push(caller);
    };
    return result;  
};


Global.printStack = function() {  
    function guessFunctionName(func) {
		var qName = func.qualifiedMethodName && func.qualifiedMethodName();
		var regExpRes = func.toString().match(/function (.+)\(/);
        return qName || (regExpRes && regExpRes[1]) || func;
    };
    
    var string = "== Stack ==\n";
    var stack = getStack();
    stack.shift(); // for getStack
    stack.shift(); // for printStack (me)
    var indent = "";
    for (var i=0; i < stack.length; i++) {
        string += indent + i + ": " +guessFunctionName(stack[i]) + "\n";
        indent += " ";        
    };
    return string;
};

Global.logStack = function() {
    this.console.log(printStack())
};

Global.logStackFor = function(obj, methodName) {
    obj[methodName] = obj[methodName].wrap(function(proceed) {
        var args = $A(arguments); args.shift(); 
        MyLogDepth++;
        dbgOn(true);
        var result = proceed.apply(this, args);
        
        logStack();
        MyLogDepth--;
        return result
    })
};

Global.indentForDepth = function(depth) {
    var s=""
    for(var i=depth; i > 0; i--) s += " ";
    return s
};

Global.resetLogDepth = function() {
    MyLogDepth = 0;    
};
Global.resetLogDepth();

Global.logCall = function(args, from, shift) {
    s = ""
    s += indentForDepth(MyLogDepth);
    if(from)
        s += String(from) + " ";
    s += args.callee.qualifiedMethodName() + "("
    var myargs = $A(args);
    if(shift) myargs.shift(); // for loggin inside wrapper functions
    myargs.each(function(ea){ s += ea + ", "});
    s += ")";
    console.log(s)
};

function logCallHelper(from, methodName, args, indent) {
    return Strings.format('%s%s>>%s(%s)',
        indentForDepth(indent),
        from.toString(),
        methodName,
        args.collect(function(ea) { return ea.toString() }).join(', '));
};

Global.toExpression = function toExpression(obj) {
	return new ExpressionSerializer().serialize(obj);
};


Global.logMethod = function(obj, methodName) {
    obj[methodName] = obj[methodName].wrap(function(proceed) {
        var args = $A(arguments); args.shift(); 
        MyLogDepth++;
        console.log(logCallHelper(this, methodName, args, MyLogDepth * 2))
        var result = proceed.apply(this, args);
        MyLogDepth--;
        return result
    })
};

Global.printObject = function(obj) {
    var s = String(obj) + ":";
    for(ea in obj) { 
        if (!Object.isFunction(obj[ea]))
            s += " " + ea + ":" + String(obj[ea]) + "\n"
    };
    return s
};

Global.printObjectFull = function(obj) {
    var s = "{";
    for(ea in obj) { 
        s += " " + ea + ":" + String(obj[ea]) + ", \n"
    };
    return s + "}"
};

Global.logObject = function(obj) {
    console.log(printObject(obj))
};


Global.stringToXML = function(string) {
    return new DOMParser().parseFromString(string, "text/xml").documentElement;
};

// Generator for an array
Global.range = function(begin, end) {
    result = [];
    for (var i = begin; i <= end; i++) {
        result.push(i);
    }
    return result;
};

Global.newFakeMouseEvent = function(point) {
    var rawEvent = {type: "mousemove", pageX: 100, pageY: 100, altKey: false, shiftKey: false, metaKey: false}; 
    var evt = new Event(rawEvent);
    evt.hand = WorldMorph.current().hands.first();
    if (point) evt.mousePoint = point;
    return evt;
};

// -------      ----------------
// ---- very simple layouters
Object.subclass('Layout', {
    
    initialize: function(baseMorph, layoutSpec) {
        this.layoutSpec = layoutSpec || {};
        this.baseMorph = baseMorph;
    },
    
    layout: function() {
        
        // this.baseMorph.layoutChanged = Morph.prototype.layoutChanged.bind(this.baseMorph);
        
        this.baseMorph.submorphs
            .reject(function(ea) { return ea.isEpimorph})
            .inject(pt(0,0), function(pos, ea) {
                ea.setPosition(pos);
                return this.newPosition(ea);
            }, this);

        if (!this.layoutSpec.noResize) {        
            var maxExtent = this.baseMorph.submorphs.inject(pt(0,0), function(maxExt, ea) {
                return maxExt.maxPt(ea.getPosition().addPt(ea.getExtent()));
            });
            this.baseMorph.setExtent(maxExtent);
        };
        
        if (this.layoutSpec.center) { this.centerMorphs() };
        
        // this.baseMorph.layoutChanged();        
        // this.baseMorph.layoutChanged = this.baseMorph.constructor.prototype.layoutChanged.bind(this.baseMorph);
    },
    
    newPosition: function(lastLayoutedMorph) {
        return lastLayoutedMorph.getPosition();
    },
    
    centerMorphs: function() {}
});

Layout.subclass('VLayout', {
    
    newPosition: function($super, lastLayoutedMorph) {
        return lastLayoutedMorph.getPosition().addXY(0, lastLayoutedMorph.getExtent().y);
    },
    
    centerMorphs: function() {
        var centerX = this.baseMorph.shape.bounds().center().x;
        this.baseMorph.submorphs.each(function(ea) {
            ea.setPosition(ea.getPosition().withX(centerX - ea.getExtent().x/2));
        }, this)
    }
    
});

Layout.subclass('HLayout', {
    
    newPosition: function(lastLayoutedMorph) {
        return lastLayoutedMorph.getPosition().addXY(lastLayoutedMorph.getExtent().x, 0);
    },
    
    centerMorphs: function() {
        var centerY = this.baseMorph.shape.bounds().center().y;
        this.baseMorph.submorphs.each(function(ea) {
            ea.setPosition(ea.getPosition().withY(centerY - ea.getExtent().y/2));
        }, this)
    }
    
});

// Some Monkeypatching for layouts :-)
// TODO: Merge

Morph.addMethods({
   layout: function(notResizeSelf) {
       this.layoutSpec && this.layoutSpec.layouterClass && new this.layoutSpec.layouterClass(this, this.layoutSpec).layout();
       this.owner && this.owner.layout();
   }
});
Morph.prototype.removeMorph = Morph.prototype.removeMorph.wrap(function(proceed, morph) {
    proceed(morph);
    this.layout();
    return this;
});

/*
 * HandPositionObserver, observes position changes of the hand and calls the function
 */
Object.subclass('HandPositionObserver', {

    documentation: 'Observes position changes of a HandMorph and calls a function',
    
    initialize: function(func, hand) {
        this.hand = hand || WorldMorph.current().hands.first();
        this.func = func;
        return this;
    },

    onGlobalPositionUpdate: function(value) {
        if (this.func) this.func.call(this, value)
    },

    start: function() {
        this.hand.formalModel.addObserver(this);
    },

    stop: function() {
        this.hand.formalModel.removeObserver(this);
    },
});

BoxMorph.subclass('lively.Helper.ToolDock', {
    
    initialize: function($super, bounds) {
        $super(bounds || this.getWorld().bounds().withWidth(60));
        this.handObserver = null;
        this.applyStyle(this.style());
    },
    
    style: function() {
        return {fill: Color.blue, borderWidth: 0, fillOpacity: 0.3};
    },
    
    startUp: function() {
        this.addItems();
        this.getWorld().addMorph(this);
        this.showPosition = pt(this.getWorld().getExtent().x - this.getExtent().x, 0);
        this.hidePosition = pt(this.getWorld().getExtent().x, 0);
        this.setPosition(this.hidePosition);
        this.triggerMoveTo(this.showPosition, this.activationArea());
    },
    
    getWorld: function() {
        return WorldMorph.current();
    },
    
    activationArea: function() {
        var relative = new Rectangle(0.95,0,0.05,1);
        return this.getWorld().bounds().scaleByRect(relative);
    },
    
    deactivationArea: function() {
        var relative = new Rectangle(0,0,0.9,1);
        return this.getWorld().bounds().scaleByRect(relative);
    },
    
    triggerMoveTo: function(position, activeScreenArea) {
        this.handObserver = new HandPositionObserver(function(point) {
            if (!activeScreenArea.containsPoint(point)) return;
            this.handObserver.stop();
            this.moveGradually(
                position,
                8,
                function() {
                    if (position.eqPt(this.showPosition))
                        this.triggerMoveTo(this.hidePosition, this.deactivationArea())
                    else
                        this.triggerMoveTo(this.showPosition, this.activationArea())
                });
        }.bind(this));
        this.handObserver.start();
    },
        
    moveGradually: function(targetPos, steps, actionWhenDone) {
        var dock = this;
        var vect = targetPos.subPt(this.getPosition());
        var stepVect = vect.scaleBy(1/steps);
        var stepTime = 10;
        var makeStep = function(remainingSteps) {
            if (remainingSteps <= 0) return actionWhenDone.apply(dock);
            dock.moveBy(stepVect);
            Global.setTimeout(makeStep.curry(remainingSteps-1), stepTime);
        };
        Global.setTimeout(makeStep.curry(steps), stepTime);
    },
    
    okToBeGrabbedBy: function(evt) {
        return null; 
    },
    
    addItems: function() {
        var dock = this;
        this.items().each(function(ea) {
            var button = new TextMorph(new Rectangle(0,0, dock.getExtent().x, 30), ea.label);
            button.handlesMouseDown = function(evt) {
                return true;
            },
            button.onMouseDown = function(evt) {
                ea.action.call(dock, evt);
                return true;
            },
            dock.addMorph(button);
        });
        new VLayout(dock, {noResize: true}).layout();
    },
    
    items: function() {
        return [
            {label: 'SystemBrowser', action: function(evt) {
                require('lively.ide').toRun(function(unused, ide) {
                    var browserMorph = new ide.SystemBrowser().openIn(evt.hand.world(), evt.point());
                    evt.hand.grabMorph(browserMorph, evt)
                })}},
            {label: 'TextWindow', action: function(evt) {
				var morph = evt.hand.world().addTextWindow({title: 'doit!', position: evt.point()});
				evt.hand.grabMorph(morph.owner, evt)
				//evt.hand.addMorph(morph);
			}},
            {label: 'OMeta Workspace', action: function(evt) {
                require('lively.Ometa').toRun(function() {
                    var wrkspc = new OmetaWorkspace().openIn(evt.hand.world(), evt.point());
                    evt.hand.grabMorph(wrkspc, evt);
			})}},
            {label: 'TestRunner', action: function(evt) {
				var openTestRunner = function(optModule) {
					var morph = new TestRunner(optModule).openIn(evt.hand.world(), evt.point());
					evt.hand.addMorph(morph);
				}
				var cb = function(input) {
					if (input === '') openTestRunner();
					var m = module(input);
					var url = new URL(m.uri());
					if (new FileDirectory(url.getDirectory()).fileOrDirectoryExists(url.filename()))
						require(input).toRun(function(u, m) { openTestRunner(m) });
					else
						evt.hand.world().prompt('Module ' + input + ' does not exist', cb, input);
				}
				evt.hand.world().prompt('For which module? None for all', cb);
			}},
        ]
    }
});
Widget.subclass('DragAndDropListTester', {
	formals: ["List1", "List2"],

	initialize: function($super) {
		$super();
		var model = Record.newPlainInstance(
			{List1: null, List1Selection: null, List2: null, List2Selection: null});
		this.relayToModel(model,
			{List1: "List1", List1Selection: "List1Selection", List2: "List2", List2Selection: "List2Selection"});
	},

	buildView: function(extent) {
	extent = extent || pt(400,400);

	var panel = PanelMorph.makePanedPanel(extent, [
            ['pane1', newDragnDropListPane, new Rectangle(0, 0, 0.5, 0.8)],
            ['pane2', newDragnDropListPane, new Rectangle(0.5, 0, 0.5, 0.8)],
			['statusPane', newTextPane, new Rectangle(0, 0.8, 1, 0.2)]
	]);

	var model = this.getModel();
	var m;

	m = panel.pane1;
	m.connectModel(model.newRelay({List: "List1", Selection: "+List1Selection"}, true));

	m = panel.pane2;
	m.connectModel(model.newRelay({List: "List2", Selection: "+List2Selection"}, true));

//	m.statusPane;
//	m.connectModel(model.newRelay({Text: "List2Selection"}, true));

	this.example();

	return panel;
},
onList1Update: function(list, source) {
	console.log('Updated List1: ' + list + ' from' + source);
},
onList2Update: function(list, source) {
	console.log('Updated List2: ' + list + ' from' + source);
},


onList1SelectionUpdate: function(sel) {
	console.log('Updated Selection1: ' + sel);
},

onList2SelectionUpdate: function(sel) {
	console.log('Updated Selection2: ' + sel);
},
example: function() {
	this.addExamplesInList1();
	this.addExamplesInList2();
},

addExamplesInList1: function() {
	var items = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
	this.setList1(items.collect(function(ea) { return {isListItem: true, string: ea.a.toString(), value: ea }}));
},
addExamplesInList2: function() {
	var items = [{b: 7}, {b: 8}, {b: 9}, {b: 10}];
	this.setList2(items.collect(function(ea) { return {isListItem: true, string: ea.b.toString(), value: ea }}));
},



});
Object.subclass('ExpressionSerializer', {

	serialize: function(value) {
		 switch (typeof value) {
			case 'string': return 'String("' + value + '")';
			case 'number': return 'Number(' + value + ')';
			case 'boolean': return 'Boolean(' + value + ')';
			case 'undefined': return 'undefined';
			case 'function': return 'ExpressionSerializer.func=' + value.toString();
			default: break;
		}
		if (value.toExpression)
			return value.toExpression();
		if (Object.isArray(value)) {
			if (value.length == 0) return '[]';
			var result = '[';
			for (var i = 0; i<value.length; i++)
				result += this.serialize(value[i]) + ',';
			result = result.slice(0,result.length-1);
			return result + ']';
		}
		if (value === null) return 'null';
		if (value.constructor === Object) {
			var startEval = 'ExpressionSerializer.object=';
			var result = '{'; 
			for (var name in value) {
				result += '"' + name + '":' + this.serialize(value[name]) + ',';
			}
			return startEval + result + '}';
		}
		if (value.constructor === Date) 
			return 'new Date("' + value.toString() + '")';
		if (Object.isElement(value))
			return 'stringToXML(\'' + Exporter.stringify(value) + '\')';
		return '/*cannot serialize ' + value.constructor.toString() + '*/';
	},
});

console.log('Helper.js is loaded');

});