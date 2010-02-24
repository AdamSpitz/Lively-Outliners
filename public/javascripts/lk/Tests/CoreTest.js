module('lively.Tests.CoreTest').requires('lively.TestFramework').toRun(function() {


/**
 * @class ConnectModelTest
 * Tests for understanding Record, Relay and View Behavior
 */
TestCase.subclass('lively.Tests.CoreTest.ConnectModelTest', {

    testAddObserver: function() {
        var formalModel = Record.newPlainInstance({MyValue: "Hello World"});
        var view = new View();
        var countUpdate = 0;
        
        view.onViewValueUpdate = function() {
           countUpdate = countUpdate + 1;
        };
        
        formalModel.addObserver(view, {MyValue: '!ViewValue'});
        
        this.assertEqual(countUpdate, 0, "onMyTextUpdate was called prematurely");        
        formalModel.setMyValue("once");        
        this.assertEqual(countUpdate, 1, "onMyTextUpdate was not called");        
        
        var observers = formalModel["MyValue$observers"]
        this.assertEqual(observers.length, 1, "wrong number of registered observers");
        
    },
    
    testNotifyObserversOf: function() {
		var formalModel1 = Record.newPlainInstance({MyValue1: "Hello World 1"});
		var formalModel2 = Record.newPlainInstance({MyValue2: "Hello World 2"});

        formalModel1.addObserver(formalModel2, {MyValue1: '=setMyValue2'}); 

		// no kickstart here...
		//this.assertEqual(formalModel1.getMyValue1(), formalModel2.getMyValue2(), "value was not updated initialy");

		var value = "Hallo Welt";
		formalModel1.setMyValue1(value);
		this.assertEqual(formalModel2.getMyValue2(), value, "value2 was not update after setting value1");
	},

    testCyclicNotifyObserversOf: function() {
		var formalModel1 = Record.newPlainInstance({MyValue1: "Hello World 1"});
		var formalModel2 = Record.newPlainInstance({MyValue2: "Hello World 2"});

        formalModel1.addObserver(formalModel2, {MyValue1: '=setMyValue2'}); 
		formalModel2.addObserver(formalModel1, {MyValue2: '=setMyValue1'});

		// no kickstart here...
		//this.assertEqual(formalModel1.getMyValue1(), formalModel2.getMyValue2(), "value was not updated initialy");

		var value = "Hallo Welt";
		formalModel1.setMyValue1(value);
		this.assertEqual(formalModel2.getMyValue2(), value, "value2 was not update after setting value1");
	},

});
TestCase.subclass('Alively.Tests.CoreTest.TestModel', {

	testSetterSource: function() {
		var calls = 0; var test = this;
		var m1 = Record.newPlainInstance({MyValue: 0});
		var m2 = Record.newPlainInstance({MyValue: 1});
		var obj = {onOtherValueUpdate: function(v, source) { test.localFunc(v, source) }};
		Object.extend(obj, ViewTrait);
		obj.relayToModel(m1, {OtherValue: "MyValue"});
		obj.relayToModel(m2, {OtherValue: "MyValue"});

		this.localFunc = function(v, source) { calls++; test.assertIdentity(m1, source) };
		m1.setMyValue(2);
		this.localFunc = function(v, source) { calls++; test.assertIdentity(m2, source) };
		m2.setMyValue(3);
		this.assertEqual(calls, 2);
	},
	
	testNodeRecord: function() {
		var rec = Record.newNodeInstance({Foo: null});
		this.assert(rec.Foo$Element, "DOM node is missing");
		var string = "HelloString";
		rec.setFoo(string);
		this.assert(rec.getFoo(), string, "string as node content is broken")
		var obj = {bar: "hello", isJSONConformant: true};
		rec.setFoo(obj);
		this.assert(rec.Foo$Element, "DOM node for obj is missing");
		this.assert(rec.getFoo(), "no foo")
		this.assert(rec.getFoo().bar, "no foo bar")
	},
	
	// fails
	testStoreReferenceInNodeRecord: function() {
		var rec = Record.newNodeInstance({Foo: null});
		var widget = new Widget();
		rec.setFoo(widget);
		this.assertIdentity(rec.getFoo(), widget);
	},


	testSetRecordFieldWithWrapper: function() {
		var rec = Record.newNodeInstance();
		var widget = new Widget();
		rec.setRecordField("Foo", widget);
		this.assertIdentity(rec["Foo$Element"], widget);
	},
	
	testConverter: function() {
		var value = {bar: "Hello", isJSONConformant: true};
		var node = Converter.encodeProperty("Foo", value);
		this.assert(node, "no node");
	},

	testConvertArray: function() {
		var value = ["Hello"];
		var node = Converter.encodeProperty("Foo", value);
		this.assert(node, "no node");
		this.assertEqual(node.textContent, '["Hello"]');
	},

	testConvertArrayWithReference: function() {
		var ref = new Widget();
		var value = ["Hello", ref];
		var node = Converter.encodeProperty("Foo", value);
		this.assert(node, "no node");
		this.assertEqual(node.textContent, '["Hello","url(#' +ref.id()+')"]');
	},
	
	testConvertArrayWithReferenceBack: function() {
		var ref = new Widget();
		var value = ["Hello", ref];
		var node = Converter.encodeProperty("Foo", value);
		
	},
	
	xtestConvertWrapper: function() {
		var rec = Record.newNodeInstance({Foo: null});
		var ref = new DummyCopierObject();
		var node = Converter.encodeProperty("Foo", ref);
		this.assert(node, "no node");
	},


});


lively.data.Wrapper.subclass('DummyCopierObject', {

	initialize: function() {
		this.a = "Hello";
		this.b = 23;
		this.rawNode =  NodeFactory.create("g");
		this.setId(this.newId());
	},
	
	copyFrom: function($super, copier, other) {
		$super(copier, other);
		this.setId(this.newId());
		copier.addMapping(other.id(), this);
		
		this.a = other.a;
		this.b = other.b;
		this.shallowChild = other.shallowChild;
		
		copier.smartCopyProperty("child", this, other);	
		
		copier.smartCopyProperty("children", this, other);
		
		return this;
	},
});	

TestCase.subclass('Alively.Tests.CoreTest.CopierTest', {
	
	testSimpleCopy: function() {
		var obj = new DummyCopierObject();
		var copy = obj.copy(new Copier());
		this.assertIdentity(obj.a, copy.a);
		this.assertIdentity(obj.b, copy.b);
	},
	
	testShallowCopy: function() {
		var obj = new DummyCopierObject();
		var obj2 = new DummyCopierObject();
		obj.shallowChild = obj2;
		var copy = obj.copy(new Copier());
		this.assertIdentity(copy.shallowChild, obj2, "copy.shallowChild is not obj2");
	},
	
	
	testSmartCopy: function() {
		var obj = new DummyCopierObject();
		var obj2 = new DummyCopierObject();
		obj.child = obj2;
		
		var copy = new DummyCopierObject();
		var copier = new Copier();
		copier.smartCopyProperty("child", copy, obj);		
		this.assert(copy.child !== obj2, "copy.child is obj2");
		this.assert(copy.child.id() !== obj2.id(), "copy.child.id() is obj2.id()");

	},

	testNestedCopy: function() {
		var obj = new DummyCopierObject();
		var obj2 = new DummyCopierObject();
		var obj3 = new DummyCopierObject();
		obj.child = obj2;
		obj.children = [obj2, obj3];
		
		var copy = obj.copy(new Copier());
		
		this.assert(copy.child !== obj2, "copy.child is obj2");
		this.assert(copy.child.id() !== obj2.id(), "copy.child.id() is obj2.id()");

		this.assert(copy.children.first().id() === copy.child.id(), "obj2 got copied twice");
		this.assert(copy.children[1].id() !== obj.children[1].id(), "obj3 in collection stayed the same");
	},

	testCyclicCopy: function() {
		var obj = new DummyCopierObject();
		var obj2 = new DummyCopierObject();
		var obj3 = new DummyCopierObject();
		obj.child = obj2;
		obj.child.child = obj; // cycle
		obj.children = [obj2, obj3]; // 2. cycle
		
		var copy = obj.copy(new Copier());
		
		this.assert(copy.child !== obj2, "copy.child is obj2");
		this.assert(copy.child.id() !== obj2.id(), "copy.child.id() is obj2.id()");

		this.assert(copy.children.first().id() === copy.child.id(), "obj2 got copied twice");
		this.assert(copy.children[1].id() !== obj.children[1].id(), "obj3 in collection stayed the same");

		this.assert(copy.child.child.id() === copy.id(), "obj cycle got copied wrong");

		// this.assert(copy.children[2].id() === copy.id(), "obj cycle 2 got copied wrong");
	},
	
	testCopyNodeRecord: function() {
		var record  =  Record.newNodeInstance({FooBar: ""});
		record.addField("DynField");
		record.setFooBar("Hello");
		record.setDynField("Tada");
		var copier = new Copier()
		var copy = record.copy(copier);
		this.assert(copy.getFooBar && copy.setFooBar, "getter and setter got lost");
		this.assertEqual(record.getFooBar(), copy.getFooBar(), "values are not copied");
		this.assertEqual(record.getDynField(), copy.getDynField(), "dyn values are not copied");
		this.assert(copier.lookup(record.id()), " model is not registered in copier");
	},
	
	testCopyRelay: function() {
		var record  =  Record.newNodeInstance({FooBar: ""});
		record.setFooBar("Hello");
		var relay = record.newRelay({FooBar: "Foo"});
		this.assert(relay instanceof Relay, "relay is no Relay");
		this.assert(relay.copy , "relay has no copy function");
		var copy = relay.copy(new Copier());
		this.assert(copy !== relay, "relay and copy are identical");
		this.assert(copy.delegatee === relay.delegatee, "relay.delegatee and copy.delegatee are not identical");
	},
	
	testCopyTextMorphWithRelay: function() {
		var model  =  Record.newNodeInstance({FooBar: ""});
		var morph = new TextMorph(new Rectangle(0, 0, 0, 0));
		morph.connectModel(model.newRelay({Text: "FooBar"}));
		var copier = new Copier();
		var modelCopy = model.copy(copier);
		var morphCopy = morph.copy(copier);
		this.assert(morphCopy.formalModel, " morph copy has no formalModel");
		this.assertIdentity(morphCopy.getModel(), modelCopy, "morphCopy model (" + morphCopy.formalModel + ") is not modelCopy ");
		
		this.assert(morphCopy.getActualModel().id() != morph.getActualModel().id(), "copy model has same id");
		
		// this.assertEqual(morph.rawNode.childNodes.length, morphCopy.rawNode.childNodes.length, "number of raw childNodes changed");

		// this.assert(morphCopy.rawNode.childNodes.length == morph.rawNode.childNodes.length, "morphCopy.rawNode.childNodes got messed up");
	
	},

	testCopyTextMorph: function() {
		var morph = new TextMorph(new Rectangle(0, 0, 0, 0));
		var morphCopy = morph.copy(new Copier());
		// we don't copy selection any more...
		// this.assertEqual(morphCopy.rawNode.childNodes.length, morph.rawNode.childNodes.length, "morphCopy.rawNode.childNodes got messed up");		
	},

	testCopyClipMorph: function() {
		var clipMorph = new ClipMorph(new Rectangle(10, 10, 50, 50));
		var morph = Morph.makeRectangle(new Rectangle(25, 25, 100, 100));
		clipMorph.addMorph(morph);
		var clipCopy = clipMorph.copy(new Copier());
		var morphCopy = clipCopy.submorphs[0];
		this.assert(clipCopy.clip !== clipMorph.clip, "clip is the same");
		this.assert(clipCopy.clip.rawNode, "clip has no rawNode");
		
	},

	testMorphWithSubnode: function() {
		var morph = Morph.makeRectangle(new Rectangle(0, 0, 10, 10));
		morph.innerMorph = Morph.makeRectangle(new Rectangle(0, 0, 10, 10));
		morph.addMorph(morph.innerMorph);
		var morphCopy = morph.copy(new Copier());
		this.assert(morphCopy.rawNode.childNodes.length == morph.rawNode.childNodes.length, "morphCopy.rawNode.childNodes got messed up");
	},





});




// logMethod(Morph.prototype, 'copyFrom'); 


// logMethod(Morph.prototype, 'removeMorph');
// logMethod(Morph.prototype,  'removeRawNode');


console.log('loaded CoreTest.js');

}) // end of module