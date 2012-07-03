# Fluid.js [![Build Status](https://secure.travis-ci.org/peteclark82/node-fluid.png)](https://secure.travis-ci.org/peteclark82/node-fluid.png)

Fluid.js is a simple fluent interface API for javascript and node.js. It is used to create fluent interfaces
around existing vanilla objects, without all the boiler plate code.

This is a useful extension to the popular [Async](https://github.com/caolan/async) module.

NOTE: Fluid.js currently only supports methods that take a callback as the last argument:-

	function(options, callback) -> callback(err, result)
		
	function(arg1, arg2, ..., callback) -> callback(err, result)
	
	etc...


## The Problem

Flow control and callbacks can become very messy and unmanagable when using lots of asynchronous functions.
Many libraries exist for node.js that make things much less painful. This module is meant to add yet another
tool to your belt.

For example a typical bit of file processing might look something like:-

	fs.readFile("./input1.txt", function(err, input1Buffer) {
		if (err) {console.log(err)} else {
			fs.readFile("./input2.txt", function(err, input2Buffer) {
				if (err) {console.log(err)} else {
					var content = input1Buffer.toString() + input2Buffer.toString();
					fs.writeFile("./output.txt", content, function(err) {
						if (err) {console.log(err)} else {
							//do something
						}
					});
				}
			});
		}
	});

With Fluid.js we could write it like this:-
	
	$f(fs).readFile("./input1.txt").readFile("./input2.txt")
		.custom(function(callback) {
			callback(null, this.readFile[0].toString() + this.readFile[1].toString());
		}).writeFile("./output1.txt", $f("this.custom[0]"))
	.go(function(err, values) {
		if (err) {console.log(err)} else {
			//do something
		}
	});
	
Any error handling is managed in the "go" callback and all callback return values are available for usage.

	
## Quick Examples

### Setup

	var $f = require("fluid");

### Example Objects
	
	var myFirstObj = {
		doSomething : function(options, callback) { 
			//do something
			callback(err, result);
		},
		doSomethingElse : function(options, callback) {
			//do something else
			callback(err, result);
		}
	};
	
	var mySecondObj = {
		doSomethingMore : function(options, callback) {
			//do something more
			callback(err, result);
		}
	};
	
### Streamlined

Note: series is the default flow control mode, so it can be ommitted
	
	$f(myFirstObj).doSomething(/* args */).doSomethingElse(/* args */)
		.with(mySecondObj).doSomethingMore(/* args */)
	.go(function(err, results) {
		// results is now an array of return values from each method callback
	});

### Expressive
	
	$f().series()		
		.with(myFirstObj)
			.doSomething(/* args */)
			.doSomethingElse(/* args */)
		.with(mySecondObj)
			.doSomethingMore(/* args */)
	.go(function(err, results) {
		// results is now an array of return values from each method callback
	});	

### Multiple flow control types
	
	$f()
		.series()		
			.with(myFirstObj)
				.doSomething(/* args */)
				.doSomethingElse(/* args */)
		.parallel()		
			.with(mySecondObj)
				.doSomethingMore(/* args */)
				.doSomethingMorer(/* args */)
				.doSomethingMorerer(/* args */)
	.go(function(err, results) {
		// results is now an array of return values from each method callback
	});
	

## Install

To install with node package manager:

    npm install fluid

	
## Download

Releases are available for download from
[GitHub](https://github.com/peteclark82/node-fluid).


## Documentation

* [fluid](#fluid)

### Fluid Context Methods

* [with](#with)
* [series](#series)
* [parallel](#parallel)
* [info](#info)
* [custom](#custom)
* [self](#self)
* [go](#go)
* [context methods](#contextMethods)
* [late bound arguments](#lateBoundArgs)

---------------------------------------

<a name="fluid" />
### fluid([context])

Creates a new fluent interface (fluid context), optionally wrapping an initial user 
specifed application context.

Note, if desired, the initial context can be left blank and applied later using the [with](#with) 
command.

__Arguments__

* context - An initial application context to wrap with fluent methods.
* Returns a new fluid context.
  
__Example__

	$f(fs).readFile("./test.txt")  
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ }


---------------------------------------
### Fluid Context Methods
---------------------------------------		


<a name="with" />
### with(context)

Switches the current application context to the one specified.

Note, The context can be switch as many times as required. Useful when working 
with multiple libraries.

__Arguments__

* context - An application context to wrap.
* Returns the current fluid context.
  
__Example__

	$f(myObj).doSomething(/* args */)
		.with(myObj2).doSomethingElse(/* args */) 
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ });


---------------------------------------

<a name="series" />
### series()

Creates a new group of method calls that will be executed in series. Multiple groups 
with different flow control types can be used together, and will themselves be executed in series when the 
[go](#go) command is called.

Note, This is the default execution mode when a new fluid context has been created.

__Arguments__

* Returns the current fluid context.
  
__Example__

	$f(myObj).series()
		.doSomething(/* args */)
		.doSomethingElse(/* args */)
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ });
		
		
---------------------------------------

<a name="parallel" />
### parallel()

Creates a new group of method calls that will be executed in parallel. Multiple groups 
with different flow control types can be used together, and will themselves be executed in series when the 
[go](#go) command is called.

Note, see the [Async](https://github.com/caolan/async) module for more information on the difference 
between series and parallel flow controls.

__Arguments__

* Returns the current fluid context.
  
__Example__

	$f(myObj).parallel()
		.doSomething(/* args */)
		.doSomethingElse(/* args */)
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ });


---------------------------------------

<a name="info" />
### info(options)

Provides a way to explicitly name callback values on the result. Also allows decorating errors with extra detail.

__Arguments__

* options - Options for providing explicit detail for result
    * name - String. Specifies a name for the callback return value on the result.
	* error - String. Specifies extra detail to decorate any error raised.
  
__Example__

	$f(fs)
		.info({name : "test1"}).readFile("./test1.txt")
		.info({name : "test2"}).readFile("./test2.txt")
	.go(function(err, result) {
		/*
			result:-
			{
				test1 : [<Buffer>],
				test2 : [<Buffer>]
			}
		*/		
	});

You can also use the short hand:-

	$f(fs)
		({name : "test1"}).readFile("./test1.txt")
		({name : "test2"}).readFile("./test2.txt")
	.go(function(err, result) {});
	
Note, there is no '.' before the '('. The fluid context itself wraps the info function.

	
---------------------------------------

<a name="custom" />
### custom(customFunction(callback))

Creates a new custom task that is added to the existing group. The custom task must invoke the callback provided 
when finished processing.

__Arguments__

* customFunction(callback) - Some custom code that will receive a callback to be invoked upon completion. 
    * callback - Function. A callback to invoke when custom code has completed.

__Example__

	$f(fs)
		.readFile("./test1.txt")
		.readFile("./test2.txt")
		.custom(function(callback) {
			callback(null, this.readFile[0].toString() + this.readFile[1].toString());
		})
		.writeFile("./output.txt", $f("this.custom[0]"))
	.go(function(err, result) {});


---------------------------------------

<a name="self" />
### self()

If the context being wrapped is a function itself, it can be invoked using the self method.

__Example__
	
	var myFunc = function(arg, callback) { 
		callback(null, arg + 1);
	}

	$f(myFunc)
		.self(1)
		.self(2)
	.go(function(err, result) {});

		
---------------------------------------

<a name="go" />
### go([options,] callback)

Executes all queued function calls against their registered application contexts, then invokes the specified
callback when completed, or any of the methods error.

If multiple flow control groups have been created, each group will be executed in series.

__Arguments__

* Optional. options - Options for execution
    * debug - Boolean. Logs out to the console information about execution for debugging.
* callback(err, result) - A callback that is invoked after all of the methods have been executed,
  or an error occurrs. If no error occurrs, result will be an object containing arrays of values from each function callback.
  
__Example__

    // assuming an object exists called myObj	
	$f(myObj).series()
		.doSomething(/* args */)
		.doSomething(/* args */)
		.doSomethingElse(/* args */)
	.parallel()
		.doSomethingMore(/* args */)
	.go(function(err, result) { 
		if (err) { /* error */ } else {
		/* 
			result :-				
			{
				"doSomething" : [
					{ /* return value from first doSomething */ }
					{ /* return value from second doSomething */ }
				],
				"doSomethingElse" : [{ /* return value from doSomethingElse */ }],
				"doSomethingMore" : [{ /* return value from doSomethingMore */ }]
			}
		*/
		}
	});


---------------------------------------

<a name="contextMethods" />
### Context Methods

The fluid context will wrap all function properties of an object.

NOTE: Fluid.js currently only supports methods that take a callback as the last argument:-

	function(options, callback) -> callback(err, result)
		
	function(arg1, arg2, ..., callback) -> callback(err, result)
	
	etc...


__Example__

    var myCalculator = {
		addTen : function(val, callback) {
			callback(null, val + 10 );
		},
		multiplyByTen : function(val, callback) {
			callback(null, val * 10);
		}
	};
		
	$f(myCalculator)
		.addTen(1)
		.addTen(2)
		.multiplyByTen(2)
	.go(function(err, result) {
		/* 
			result :-
			{
				"addTen" : [11, 12],
				"multiplyByTen" : [20]
			}		
		*/
	});
	
You can even use the result of previous callbacks in the arguments to other functions. See [late bound arguments](#lateBoundArgs).
	
	$f(myCalculator)
		.addTen(1)
		.multiplyByTen($f("this.addTen[0]"))
	.go(function(err, result) {
		/* 
			result :-
			{
				"addTen" : [11],
				"multiplyByTen" : [110]
			}		
		*/
	});


---------------------------------------

<a name="lateBoundArgs" />
### Late Bound Arguments - fluid(expression)

Late bound arguments are useful when you need the result of a previous function as an argument to another.

__Arguments__

* expression - String. A javascript expression to be evaluated when the function is called.
	'this' is the current result so far, and will contain return values of all previously executed callbacks.

__Example__

	$f(myCalculator)
		.addTen(1)
		.multiplyByTen($f("this.addTen[0]"))
	.go(function(err, result) {
		/* 
			result :-
			{
				"addTen" : [11],
				"multiplyByTen" : [110]
			}		
		*/
	});
	
Note, Fluid treats all string passed to it as late bound argument expressions.
