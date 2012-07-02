var vows = require('vows');
var assert = require('assert');
var $f = require("../lib/fluid.js");


vows.describe('Using fluid').addBatch({
    'A fluid inteface': {
		topic : function () {
			this.callback(null, {
				createSyncContext : function() {
					return {
						method : function(options, callback) { callback(null, options); },
						method2 : function(options, callback) { callback(null, options); },
						errorMethod : function(options, callback) { callback({message : options}); } 
					};
				},
				createAsyncContext : function() {
					return {
						method : function(options, callback) {
							setTimeout(function() {
								callback(null, options);
							}, options);
						}
					};
				}
			});
		},
		'when executing' : {
			'with a single flow mode queue should run' : {
				topic : function (topic) { 
					var self = this;
					
					$f(topic.createSyncContext())
						.method(1).method(2).method(3)
					.go(function(err, series) {
						$f(topic.createAsyncContext()).parallel()
							.method(60).method(40).method(20)
						.go(function(err, parallel) {
							self.callback(null, { series: series, parallel : parallel });
						});
					});
				},
				'in series by default': function (err, topic) {
					assert.isNull(err);
					assert.equal(topic.series.method.length, 4);
					assert.equal(topic.series.method[0], 1);
					assert.equal(topic.series.method[1], 2);
					assert.equal(topic.series.method[2], 3);
				},
				'in parallel if specified': function (err, topic) {
					assert.isNull(err);
					assert.equal(topic.parallel.method.length, 3);
					assert.equal(topic.parallel.method[0], 20);
					assert.equal(topic.parallel.method[1], 40);
					assert.equal(topic.parallel.method[2], 60);
				}
			},
			'with a multiple flow mode queue should run' : {
				topic : function (topic) { 
					var self = this;
					
					$f(topic.createAsyncContext())
						.parallel()
							.method(60).method(40).method(20)
						.series()
							.method(1).method(2).method(3)
					.go(function(err, res) {
						self.callback(null, res);
					});
				},
				'in the specified modes': function (err, topic) {
					assert.isNull(err);
					assert.equal(topic.method.length, 6);
					assert.equal(topic.method[0], 20);
					assert.equal(topic.method[1], 40);
					assert.equal(topic.method[2], 60);
					assert.equal(topic.method[3], 1);
					assert.equal(topic.method[4], 2);
					assert.equal(topic.method[5], 3);
				}
			},
		},
		'that executed successfully should' : {
			'return an object' : {
				topic : function (topic) { 
					var self = this;
					
					$f(topic.createSyncContext())
						.method(1).method(2)
						.method2(3).method2(4)
					.go(function(err, res) {
						self.callback(null, res);
					});
				},
				'using an array to allow for multiple calls': function (err, topic) {
					assert.isTrue(topic.method instanceof Array);
					assert.isTrue(topic.method2 instanceof Array);
				},
				'with return values from each method': function (err, topic) {
					assert.equal(topic.method[0], 1);
					assert.equal(topic.method[1], 2);
					assert.equal(topic.method2[0], 3);
					assert.equal(topic.method2[1], 4);
				}
			}
		},
		'that errored in method call should' : {
			topic : function (topic) { 
				var self = this;
				
				$f(topic.createSyncContext())
					.method(1).errorMethod("error")
				.go(function(err, res) {
					self.callback(err, res);
				});
			},
			'return the error': function (err, topic) {
				assert.equal(err.message, "error");
			},
			'still return values prior to the error': function (err, topic) {
				assert.isDefined(topic.method);
				assert.equal(topic.method[0], 1);
			}
		},
		'with multiple contexts should': {
            topic : function (topic) { 
				var self = this;
				
				$f(topic.createSyncContext())
					.method(1)
				.with(topic.createAsyncContext())
					.method(2)
				.go(function(err, res) {
					self.callback(err, res);
				});
			},
			'return aggregated results': function (err, topic) {
				assert.equal(topic.method.length, 2);
				assert.equal(topic.method[0], 1);
				assert.equal(topic.method[1], 2);
			}
        },
		'should allow context to be a function': {
            topic : function (topic) { 
				var self = this;
				
				$f(function(arg, callback) { callback(null, arg + 1); })
					.self(1)
				.go(function(err, res) {
					self.callback(err, res);
				});
			},
			'that can be called using self': function (err, topic) {
				assert.isDefined(topic.self);
				assert.equal(topic.self[0], 2);
			}
        },
		'should allow explicit' : {
			topic : function (topic) { 
				var self = this;
				
				$f(topic.createSyncContext())
					.info({name : "first"}).method(1)
					.info({error : "wrapped error"}).errorMethod("error")
				.go(function(err, res) {
					self.callback(err, res);
				});
			},
			'return value names': function (err, topic) {
				assert.isDefined(topic.first);
				assert.equal(topic.first, 1);
			},
			'error messages to wrap the ones raised': function (err, topic) {
				assert.isDefined(err);
				assert.equal(err.message, "wrapped error");
				assert.equal(err.error.message, "error");
			}
		},
		'should allow custom code to be run and': {
			topic : function (topic) { 
				var self = this;
				
				$f(topic.createSyncContext())
					.custom(function(callback) {
						callback(null, "custom");
					})
					.custom(function(callback) {
						callback({ message : "error"});
					})
				.go(function(err, res) {
					self.callback(err, res);
				});
			},
			'return a value': function (err, topic) {
				assert.isDefined(topic.custom);
				assert.equal(topic.custom[0], "custom");
			},
			'raise an error': function (err, topic) {
				assert.isDefined(err);
				assert.equal(err.message, "error");
			}
		},
		'should allow late bound parameters to be passed to method calls' : {
			topic : function (topic) { 
				var self = this;
				
				$f(topic.createSyncContext())
					.method(1)
					.method($f("this.method[0] + 1"))
					.method($f("BAD CODE"))
				.go(function(err, res) {
					self.callback(err, res);
				});
			},
			'and resolve successfully': function (err, topic) {
				assert.equal(topic.method[0], 1);
				assert.equal(topic.method[1], 2);
			},
			'and raise error if thrown': function (err, topic) {
				assert.isDefined(err.message);
			}
		}
    }
}).exportTo(module);