# Fluid.js

Fluid.js is a simple fluent interface API for javascript and node.js. It is used to create a fluent interface
around existing vanilla objects, without all the boiler plate.

This is a useful extension to the excellent [Async](https://github.com/caolan/async) module.

NOTE: Fluid.js will only wrap methods which implement the following asynchronous signature:-

	function(options, callback) -> callback(err, result)


## Quick Examples

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

	var fluid = require("fluid");
	
	/* Expressive example */
	
    fluid().series()		
		.with(myFirstObj)
			.doSomething({ /* args */ })
			.doSomethingElse({ /* args */ })
		.with(mySecondObj)
			.doSomethingMore({ /* args */ })
	.go(function(err, results) {
		// results is now an array of return values passed to each method callback
	});
	
	/* Streamlined example - (Note: series is the default mode so can be ommitted) */
	
	fluid(myFirstObj).doSomething({ /* args */ }).doSomethingElse({ /* args */ })
		.with(mySecondObj).doSomethingMore({ /* args */ })
	.go(function(err, results) {
		// results is now an array of return values passed to each method callback
	});
	
	/* Multiple queue types example */
	
    fluid()
	.series()		
		.with(myFirstObj)
			.doSomething({ /* args */ })
			.doSomethingElse({ /* args */ })
	.parallel()		
		.with(mySecondObj)
			.doSomethingMore({ /* args */ })
			.doSomethingMorer({ /* args */ })
			.doSomethingMorerer({ /* args */ })
	.go(function(err, results) {
		/*
			results is now an array (item for each queue) of arrays (item for each method return value)
		*/
	});
	

There are many more functions available so take a look at the docs below for a
full list. This module aims to be comprehensive, so if you feel anything is
missing please create a GitHub issue for it.


## Install

To install with node package manager:

    npm install fluid

	
## Download

Releases are available for download from
[GitHub](http://myurl).


## Appreciation

Thanks to [caolan](https://github.com/caolan) for his great module [Async](https://github.com/caolan/async)


## Documentation

* [fluid](#fluid)

### Fluid Context Methods

* [with](#with)
* [series](#series)
* [parallel](#parallel)
* [go](#go)
* [context methods](#contextMethods)


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

    // assuming an object exists called myObj
	var fluid = require("fluid");
	
	fluid(myObj).doSomething({ /* args */ })  
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ }

		
---------------------------------------

<a name="with" />
### with(context)

Switches the current application context to the one specified.

Note, The context can be switch as many times as required. Useful for cleanly working 
with multiple objects.

__Arguments__

* context - An application context to wrap with fluent methods.
* Returns the current fluid context.
  
__Example__

    // assuming a objects exist called myObj and myObj2
	var fluid = require("fluid");
	
	fluid(myObj).doSomething({ /* args */ })
		.with(myObj2).doSomethingElse({ /* args */ }) 
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ }


---------------------------------------

<a name="series" />
### series()

Creates a new queue of method calls that will be executed in series. Multiple queues 
with different flow control types can be created, and will themselves be executed in series when the 
[go](#go) command is called.

Note, This is the default execution mode when a new fluid context has been created.

__Arguments__

* Returns the current fluid context.
  
__Example__

    // assuming an object exists called myObj
	var fluid = require("fluid");
	
	fluid(myObj).series()
		.doSomething({ /* args */ })
		.doSomethingElse({ /* args */ })
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ }
		
		
---------------------------------------

<a name="parallel" />
### parallel()

Creates a new queue of method calls that will be executed in parallel. Multiple queues 
with different flow control types can be created, and will themselves be executed in series when the 
[go](#go) command is called.

Note, see the [Async](https://github.com/caolan/async) module for more information on the difference 
between series and parallel flow controls.

__Arguments__

* Returns the current fluid context.
  
__Example__

    // assuming an object exists called myObj
	var fluid = require("fluid");
	
	fluid(myObj).parallel()
		.doSomething({ /* args */ })
		.doSomethingElse({ /* args */ })
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ }

		
---------------------------------------

<a name="go" />
### go(callback)

Executes all queued method calls against their registered application contexts, then invokes the specified
callback when successfully completed, or any of the methods error.

__Arguments__

* callback(err, res) - A callback which is called after all the methods have been called successfully,
  or an error has occurred. If no errors occurr res will be an array of return values passed to each method callback.
  If multiple queues have been executed it will be an array (item for each queue) of arrays 
  (item for each method return value)
  
__Example__

    // assuming an object exists called myObj
	var fluid = require("fluid");
	
	fluid(myObj).series()
		.doSomething({ /* args */ })
		.doSomethingElse({ /* args */ })
		.parallel()
		.doSomethingMore({ /* args */ })
		/* .etc.etc... */
	.go(function(err, res) { 
		if (err) { /* error */ } else {
			console.log(res[0][0]);
			console.log(res[0][1]);
			
			console.log(res[1][0]);
			/* .etc.etc... */
		}
	}


---------------------------------------

<a name="contextMethods" />
### Context Methods

The fluid context will wrap all properties of an application context that are functions.

NOTE: It is only possible to wrap functions that implement 
the following asynchronous signature:-

	function(options, callback) -> callback(err, result)

__Example__

    var myObj = {
		doSomething : function(options, callback) {
			callback(null, { prop1 : 1 });
		},
		doSomethingElse : function(options, callback) {
			callback({ message : "Error!" });
		},
		doSomethingMore : function(options, callback) {
			callback(null, { prop2 : 1 });
		}
	};
	
	var fluid = require("fluid");
	
	fluid(myObj)
		.doSomething({ /* args */ })
		.doSomethingElse({ /* args */ })
		.doSomethingMore({ /* args */ })
	.go(function(err, res) {
		/* finished with error, without executing doSomethingMore */
	}