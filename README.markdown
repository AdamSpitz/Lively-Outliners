# Lively Outliners

This is an attempt to bring a little bit of the goodness of [Self](http://selflanguage.org) to Javascript, using Sun Labs' [Lively Kernel](http://www.lively-kernel.org/) as a base.

Compared to Self, this thing is slow, it's ugly, it's crippled... it's a complete hack. But it runs in a web browser.


## What's in here?

Not much. The main thing is object outliners - similar to Smalltalk's inspectors, in that they let you look at an individual object, but with enough programming features (you can edit methods, organize slots into categories, attach comments to objects or slots, drag an arrow to set the contents of a slot, etc.) that they're used for writing code as well. In Self we use these as a replacement for both inspectors and code browsers. The idea is to give you the feeling of [getting your hands directly on your objects](http://selflanguage.org/documentation/published/object-focus.html), rather than feeling like you're using a tool that shows you a view of an object that's hidden behind the scenes somewhere.

There's also a [transporter system](http://research.sun.com/self/papers/transporter.html) for organizing objects into modules and filing them out as .js files. (The demo isn't quite fully-functional; I had trouble getting WebDAV working on my server. But I rigged up a little CGI script so that when you file out a module you can download the .js file through your web browser.)


## How stable is it?

Not very. I don't really trust this thing with my code yet. (I'm using it to manage most of its own code, but I double-check the filed-out .js files to make sure they look OK.) But it's getting more and more solid every day.

I've mostly been testing with Safari, but I think it should run on Firefox and Chrome too. Not sure about Opera. Definitely not IE (though it could be used to produce Javascript code that runs on IE, as long as you're careful to avoid the features that IE doesn't support).


## Is there a demo to play with?

For now I've got something up here:

  [http://adamspitz.com/Lively-Outliners/example.xhtml](http://adamspitz.com/Lively-Outliners/example.xhtml)
