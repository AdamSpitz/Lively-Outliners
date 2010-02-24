module('lively.Tests.OmetaTest').requires('lively.TestFramework', 'lively.Helper', 'lively.Ometa').toRun(function() {

TestCase.subclass('TextTest', {

    styleOfIncludes: function(spec, style) {
        var names = Object.keys(spec).select(function(ea) { return spec.hasOwnProperty(ea) });
        return names.all(function(ea) { return style[ea] == spec[ea]});
    },
    
    assertTextStyle: function(text, spec, beginPos, length, msg) {
        var endPos = length ? beginPos + length - 1: beginPos;
        range(beginPos, endPos).each(function(i) {
            if (this.styleOfIncludes(spec, text.emphasisAt(i))) return;
            this.assert(false, 'TextStyle of ' + text.string + ' has not '
                                + JSON.serialize(spec) + ' at position ' + i
                                + ' character: ' + text.string[i] + ' -- ' + msg);
        }, this);
    },
    
    // to test assertion
    testThisTest: function() {
        var style = {style: 'bold', fontSize: 4, color: Color.red};
        var text = new lively.Text.Text('Hello', style);
        this.assert(text instanceof lively.Text.Text, 'not text');
        // result.asMorph().openInWorld();
        this.assertTextStyle(text, {color: Color.red}, 0, text.string.length);
    }
});


TestCase.subclass('OmetaLoadingTest', {

    shouldRun: false,
    
    testLoadAllFiles: function() {
        require('ometa/lib.js').toRun(function() {
        module('ometa/lib.js').requires('ometa/ometa-base.js').toRun(function() {
        module('ometa/ometa-base.js').requires('ometa/parser.js').toRun(function() {
        module('ometa/parser.js').requires('ometa/bs-js-compiler.js').toRun(function() {
        module('ometa/bs-js-compiler.js').requires('ometa/bs-ometa-compiler.js').toRun(function() {
        module('ometa/bs-ometa-compiler.js').requires('ometa/bs-ometa-optimizer.js').toRun(function() {
        module('ometa/bs-ometa-optimizer.js').requires('ometa/bs-ometa-js-compiler.js').toRun(function() {
        // module('ometa/bs-ometa-js-compiler.js').requires('ometa/bs-project-list-parser.js').toRun(function() {
        // module('ometa/bs-project-list-parser.js').requires('ometa/workspace.js').toRun(function() {
        // module('ometa/ometa/workspace.js').requires('ometa/wiki.js').toRun(function() {
        // })})})
        })})})})})})});
        
    }
});


TestCase.subclass('OmetaTest', {
                        
    testBSOMetaJSParser: function() {
        var s = "3+ 4";
        var tree = BSOMetaJSParser.matchAll(s, "topLevel");
        this.assert(tree, " is defined");
        this.assertEqual(toOmetaString(tree), "[begin, [binop, +, [number, 3], [number, 4]]]");
    },

    testBSOMetaJSTranslator: function() {
        var s = "3+ 4";    
        var tree = BSOMetaJSParser.matchAll(s, "topLevel");
        var result= BSOMetaJSTranslator.match(tree, "trans");
        this.assertEqual(String(result), "((3) + (4))");
    },
    
    testOmetaSampleInterpreter: function() {
        var calcSrc = BSOMetaJSParser.matchAll(OmetaTest.ometaSampleInterpeter, "topLevel");
        var result = eval(BSOMetaJSTranslator.match(calcSrc, "trans"));
        this.assertEqual(result, 42);
    },
    
    testEvalOmeta: function() {
        this.assertEqual(OMetaSupport.ometaEval(OmetaTest.ometaSampleInterpeter), 42)
    }
});

OmetaTest.ometaSampleInterpeter = "        ometa Calc {  \n\
  digit    = super(#digit):d          -> digitValue(d),\n\
  number   = number:n digit:d         -> (n * 10 + d) \n\
           | digit,\n\
  addExpr  = addExpr:x '+' mulExpr:y  -> (x + y) \n\
           | addExpr:x '-' mulExpr:y  -> (x - y) \n\
           | mulExpr,\n\
  mulExpr  = mulExpr:x '*' primExpr:y -> (x * y)\n\
           | mulExpr:x '/' primExpr:y -> (x / y)\n\
           | primExpr,\n\
  primExpr = '(' expr:x ')'           -> x\n\
           | number,\n\
  expr     = addExpr\n\
}\n\
\n\
Calc.matchAll('6*(4+3)', 'expr')";

});