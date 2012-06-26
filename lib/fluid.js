var async = require("async");

module.exports = function(initialContext) {
	var taskGroups = [];
	var thisContext = [];

	return withContext(initialContext);
	
	function withContext(context) {	
		var fluidContext = {
			with : withContext,
			go : executeTaskGroups,
			series : series,
			parallel : parallel
		};
			
		if (context) {
			Object.keys(context).forEach(function(propertyName) {
				var contextProperty = context[propertyName];
				if (contextProperty instanceof Function) {
					fluidContext[propertyName] = createFluentWrapperFunction(propertyName, contextProperty);
				}
			});
		}
		
		return fluidContext;		
		
		function createFluentWrapperFunction(propertyName, contextProperty) {
			return function(options) {
				if (taskGroups.length === 0) {
					series();
				}
				taskGroups[taskGroups.length-1].tasks.push(function(next) {
					if (options instanceof Function) {
						options = options.call(thisContext, []);
					}
					contextProperty(options, function(err, res) {
						if (err) { next(err); } else {
							thisContext.push(res);
							thisContext[propertyName] = res;
							next(null, {
								name : propertyName,
								result : res
							});
						}
					});
				});
				return fluidContext;
			};
		}
		
		function executeTaskGroups() {
			var options = arguments.length == 2 ? arguments[0] : {};
			var callback = arguments.length == 2 ? arguments[1] : arguments[0];
			var debug = options && options.debug ? options.debug : false;
			
			if (debug) { console.log("Executing "+ taskGroups.length + " task group(s)"); }
			
			var hasMultipleTaskGroups = taskGroups.length > 1;
			var results = hasMultipleTaskGroups ? [] : null;
			
			async.forEachSeries(taskGroups, function(taskGroup, next) {
				if (debug) { console.log("Executing "+ taskGroup.tasks.length +" async task(s) in : "+ taskGroup.modeType); }
				taskGroup.mode(taskGroup.tasks, function(err, res) {
					if (err) { next(err); } else {
						finalResults = [];
						for(var i=0; i<res.length; i++) {
							finalResults[res[i].name] = res[i].result;
							finalResults.push(res[i].result);
						}
						if (hasMultipleTaskGroups) {
							results.push(finalResults);
						} else {
							results = finalResults;
						}
						next();
					}
				})
			},function(err) {
				taskGroups = [];
				thisContext = [];
				callback(err ? err : null, results);
			});
		}
		
		function series() {
			taskGroups.push({ modeType : "series", mode : async.series, tasks : [] });
			return fluidContext;
		}
		
		function parallel() {
			taskGroups.push({ modeType : "parallel", mode : async.parallel, tasks : [] });
			return fluidContext;
		}
	}
};