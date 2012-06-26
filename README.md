# Fluid.js

Fluid.js is a simple fluent interface API for javascript and node.js. It is used to create fluent interfaces
around existing vanilla objects, without all the boiler plate code.

This is a useful extension to the popular [Async](https://github.com/caolan/async) module.

NOTE: Fluid.js currently only supports methods that implement the following asynchronous function signature:-

	function(options, callback) -> callback(err, result)
	
The next version (due very soon) will also support the following:-
	
	function(arg1, arg2, ..., callback) -> callback(err, result)


## The Problem

The pain of flow control and callback hell with asynchronous javascript code is a widely discussed subject.
Many libraries exist for node.js that make things much less painful. This module is meant to add another useful
tool to that kit.

Take the following objects:-
	
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

The code to execute these "callback" based methods would look something like this:-

	myFirstObj.doSomething({ /* args */ }, function(err, res1) {
		if (err) {
			console.log(err);
		} else {
			myFirstObj.doSomethingElse({ /* args */ }, function(err, res2) {
				if (err) {
					console.log(err);
				} else {
					myFirstObj.doSomethingMore({ /* args */ }, function(err, res3) {
						if (err) {
							console.log(err);
						} else {
							/* finished */
						}
					});
				}
			});
		}
	});

The solution...
	
## Quick Examples

### Setup

	var fluid = require("fluid");
	
### Expressive
	
	fluid().series()		
		.with(myFirstObj)
			.doSomething({ /* args */ })
			.doSomethingElse({ /* args */ })
		.with(mySecondObj)
			.doSomethingMore({ /* args */ })
	.go(function(err, results) {
		// results is now an array of return values passed to each method callback
	});
	
### Streamlined

Note: series is the default flow control mode, so it can be ommitted
	
	fluid(myFirstObj).doSomething({ /* args */ }).doSomethingElse({ /* args */ })
		.with(mySecondObj).doSomethingMore({ /* args */ })
	.go(function(err, results) {
		// results is now an array of return values passed to each method callback
	});
	
### Multiple flow control types
	
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
	

## Install

To install with node package manager:

    npm install fluid

	
## Download

Releases are available for download from
[GitHub](https://github.com/peteclark82/node-fluid).


## Appreciation

Many thanks to [caolan](https://github.com/caolan) for sharing his excellent module [Async](https://github.com/caolan/async)


## Documentation

* [fluid](#fluid)

### Fluid Context Methods

* [with](#with)
* [series](#series)
* [parallel](#parallel)
* [go](#go)
* [context methods](#contextMethods)

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

    // assuming an object exists called myObj
	var fluid = require("fluid");
	
	fluid(myObj).doSomething({ /* args */ })  
		/* .etc.etc... */
	.go(function(err, res) { /* finished */ }


---------------------------------------
### Fluid Context Methods
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
with different flow control types can be used together, and will themselves be executed in series when the 
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
with different flow control types can be used together, and will themselves be executed in series when the 
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
### go([options,] callback)

Executes all queued method calls against their registered application contexts, then invokes the specified
callback when completed, or any of the methods error.

If multiple flow control groups have been created, each group will be executed in series.

__Arguments__

* Optional. options - Options for execution
    * debug - Boolean. Logs out to the console information about execution for debugging.
* callback(err, res) - A callback that is invoked after all of the methods have been run,
  or an error occurrs. If no error occurrs, res will be an array of return values that were passed to each method callback.
  If multiple flow control queues have been executed it will be an array (entry for each queue) of arrays 
  (entry for each method return value)
  
__Example__

    // assuming an object exists called myObj
	var fluid = require("fluid");
	
	fluid(myObj).series()
		.doSomething({ /* args */ })
		.doSomethingElse({ /* args */ })
		.parallel()
		.doSomethingMore({ /* args */ })
	.go(function(err, res) { 
		if (err) { /* error */ } else {
		/* 
			res :-
				
				[
					[
						0 : { /* return value from doSomething */ },
						1 : { /* return value from doSomethingElse */ },
						"doSomething" : { /* return value from doSomething */ },
						"doSomethingElse" : { /* return value from doSomethingElse */ }
					],
					[
						0 : { /* return value from doSomethingMore */ },
						"doSomethingMore" : { /* return value from doSomethingMore */ },
					]
				]
				
			if "parallel" wasn't there, and it was only a single mode of flow control it would look 
			like :-
				
				[
					0 : { /* return value from doSomething */ },
					1 : { /* return value from doSomethingElse */ },
					2 : { /* return value from doSomethingMore */ },
					"doSomething" : { /* return value from doSomething */ },
					"doSomethingElse" : { /* return value from doSomethingElse */ },
					"doSomethingMore" : { /* return value from doSomethingMore */ }
				]
			
		*/
		}
	}


---------------------------------------

<a name="contextMethods" />
### Context Methods

The fluid context will wrap all function properties of an application context.

NOTE: It is only possible to wrap functions that implement 
the following asynchronous signature:-

	function(options, callback) -> callback(err, result)

__Example__

    var myObj = {
		doSomething : function(options, callback) {
			callback(null, { /* return values */ });
		},
		doSomethingElse : function(options, callback) {
			callback({ message : "Error!" });
		},
		doSomethingMore : function(options, callback) {
			callback(null, { /* return values */ });
		}
	};
	
	var fluid = require("fluid");
	
	fluid(myObj)
		.doSomething({ /* args */ })
		.doSomethingElse({ /* args */ })
		.doSomethingMore({ /* args */ })
	.go(function(err, res) {
		/* finished with error, without executing doSomethingMore */
	});
	
You can even use the result of previous methods in the options to others methods

	var myObj = {
		doSomething : function(options, callback) {
			callback(null, { ret1 : options.opt1 + 10 });
		},
		doSomethingElse : function(options, callback) {
			callback(null, { ret2 : options.opt2 * 10 });
		}
	};
	
	var fluid = require("fluid");
	
	fluid(myObj)
		.doSomething({ opt1 : 1 })
		.doSomethingElse(function(){return { opt2 : this[0].ret1 }})
	.go(function(err, res) {
		/* 
			res :-
				[
					0 : { ret1 : 11 },
					1 : { ret2 : 110 },
					"doSomething" : { ret1 : 11 },
					"doSomethingElse" : { ret2 : 110 }
				]		
		*/
	});

Or by name if you prefer...

	fluid(myObj)
		.doSomething({ opt1 : 1 })
		.doSomethingElse(function(){return { opt2 : this.doSomething.ret1 }})
	.go(function(err, res) {
		/* finished */
	});