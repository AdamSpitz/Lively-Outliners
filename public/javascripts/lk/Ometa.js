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


module('Ometa.js').requires('ometa/ometa-base.js', 'ometa/parser.js', 'ometa/bs-ometa-compiler.js', 'ometa/bs-ometa-js-compiler.js', 'ometa/bs-js-compiler.js', 'ometa/bs-ometa-optimizer.js').toRun(function() {
                                           
/*
    An Ometa Workspace like http://www.cs.ucla.edu/~awarth/ometa/.
    Uses Alessandro Warth OMeta-js 2 to evalute text. 
*/

OMetaSupport = {
    
    fromFile: function(fileName) {
        var src = OMetaSupport.fileContent(fileName);
        var grammar = OMetaSupport.ometaEval(src);
        return grammar;
    },
    
    translateAndWrite: function(sourceFileName, destFileName, additionalRequirements) {
	var url = URL.source.getDirectory();
	var requirementsString = additionalRequirements ? ',\'' + additionalRequirements.join('\',\'') + '\'' : '';
	var str = Strings.format('module(\'%s\').requires(\'ometa/parser.js\'%s).toRun(function() {\n%s\n});',
		destFileName,
		requirementsString,
		OMetaSupport.translateToJs(OMetaSupport.fileContent(sourceFileName)));
	var dir = new FileDirectory(url);
	dir.writeFileNamed(destFileName, str);
	console.log(Strings.format('Successfully compiled OMeta grammar %s to %s',
		sourceFileName, destFileName));
    },
    
    ometaEval: function(src) {
        var jsSrc = OMetaSupport.translateToJs(src);
        return eval(jsSrc);
    },
    
    translateToJs: function(src) {
        var ometaSrc = OMetaSupport.matchAllWithGrammar(BSOMetaJSParser, "topLevel", src);
        var jsSrc = OMetaSupport.matchWithGrammar(BSOMetaJSTranslator, "trans", ometaSrc);
        return jsSrc;
    },
    
    matchAllWithGrammar: function(grammar, rule, src, errorHandling) {
		// errorHandling can be undefined or a callback or true (own error handle is used)
		var errorFunc;
		if (!errorHandling) errorFunc = OMetaSupport.handleError;
		else if (errorHandling instanceof Function) errorFunc = errorHandling
		else errorFunc = OMetaSupport.handleErrorDebug;
        return grammar.matchAll(src, rule, null, errorFunc.curry(src, rule));
    },
    
    matchWithGrammar: function(grammar, rule, src, errorHandling) {
		// errorHandling can be undefined or a callback or true (own error handle is used)
		var errorFunc;
		if (!errorHandling) errorFunc = OMetaSupport.handleError;
		else if (errorHandling instanceof Function) errorFunc = errorHandling
		else errorFunc = OMetaSupport.handleErrorDebug;
		return grammar.match(src, rule, null, errorFunc.curry(src, rule));
    },
    
    handleErrorDebug: function(src, rule, grammarInstance, errorIndex) {
        var charsBefore = 500;
        var charsAfter = 250;
        console.log('OMeta Error -- ' + rule);
        var startIndex = Math.max(0, errorIndex - charsBefore);
        var stopIndex = Math.min(src.length, errorIndex + charsAfter);

		console.log('Last twenty Rules: ' + grammarInstance._ruleStack.slice(grammarInstance._ruleStack.length-20));
		if (src.constructor === Array) {
			console.log(src = '[' + src.toString() + ']');
		} else {
			console.log(src.substring(startIndex, errorIndex) + '<--Error-->' + src.substring(errorIndex, stopIndex));
		}
    },
    
    handleError: function(src, rule, grammarInstance, errorIndex) {},
    
    fileContent: function(fileName) {
        var url = URL.source.withFilename(fileName);
        var resource = new Resource(Record.newPlainInstance({URL: url, ContentText: null}));
        resource.fetch(true);
        return resource.getContentText();
    }
    
};

Widget.subclass('OmetaWorkspace', {
    
    defaultViewExtent: pt(400,250),
    
    buildView: function() {
        var panel =  PanelMorph.makePanedPanel(this.defaultViewExtent, [
                ['textPane', function (initialBounds){return new TextMorph(initialBounds)}, new Rectangle(0, 0, 1, 0.0)]]);
        panel.textPane.setExtent(this.defaultViewExtent);
        // override the standart eval function in this instance to evaluate Ometa Source instead of JavaScript
        panel.textPane.tryBoundEval = function (str) {
        	var result;
        	try { result = OMetaSupport.ometaEval(str); }
        	catch (e) { // this.world().alert("exception " + e);
        	    console.log('error evaling ometa: ' + e) };
        	return result;
         };
        return panel;
    }
    
});

/*
 * A sample OMeta Workspace with the simple interpreter from the OMeta-js Tutorial
 */
OmetaWorkspace.openOmetaWorkspace = function() {
    var w = new OmetaWorkspace(); 
	w.openIn(WorldMorph.current(), pt(540, 20));
	w.panel.textPane.setTextString("ometa Calc {  \n\
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
    Calc.matchAll('6*(4+3)', 'expr')");	
	return w
};

// Interface for using the parser. It would be better to extend the parser directly...

lively.Text.createText = function(str, style) {
    return new lively.Text.Text(str, style);
};

// Just a spike
Object.subclass('SyntaxHighlighter', {

    parserSrcFileName: 'lk-js-parser.txt',
    
    _parserSrc: "ometa My <: Parser { \
        isLKParser  = ''                                                        -> true, \
\
    	nameFirst       = letter | '$' | '_', \
      	nameRest        = nameFirst | digit, \
      	iName           = firstAndRest(#nameFirst, #nameRest):r		            -> r.join(''), \
      	isKeyword :x    = ?BSJSParser._isKeyword(x), \
      	name            = iName:n ~isKeyword(n)								    -> n, \
 \
        spacesNoNl      = (~'\n' space)*										-> ' ', \
        sc              = spacesNoNl ('\n' | &'}' | end)						-> '<real  end>' \
                        | \";\"													-> '<end because of ; >', \
        srcElem         = \"function\" /*\"name\":n*/ funcRest:f                    -> { 'this is a fuction:' + f } \
                        | stmt:s												-> s, \
        funcRest        = '(' listOf(#formal, ','):fs ')' '{' srcElems:body '}' -> { fs + '<--->' + body}, \
        formal          = spaces:sps name:n								            -> { sps.join('') + n}, \
        srcElems        = srcElem*:ss                                           -> ss, \
        stmt            = something:sth                                         ->  { sth + '<END OF STMT>' }, \
       something        = (~sc anything)+:cs sc:end			                    ->  { cs.join('') + end } \
    };",
    
    initialize: function() {
        this.parser = Global.LKJSParser ? Global.LKJSParser : OMetaSupport.ometaEval(this.parserSrc());
    },
    
    parse: function(string, rule) {
        if (!rule) rule = 'srcElem';
        return this.parser.matchAll(string, rule);
    },
    
    highlightFunction: function(sourceString) {
        var attributedSrc = this.parse(sourceString);
        // var style = {style: 'bold', fontSize: 4, color: Color.red};
        // var t = new text.Text(attributedSrc, style);
        var t = attributedSrc;
        return t;
    },
    
    parserSrc: function() {
        var url = URL.source.withFilename(this.parserSrcFileName);
        var resource = new Resource(Record.newPlainInstance({URL: url, ContentText: null}));
        resource.fetch(true);
        return resource.getContentText();
    }
});

});