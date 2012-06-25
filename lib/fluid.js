var async = require("async");

module.exports = function(initialContext) {
	var taskGroups = [];

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
					fluidContext[propertyName] = addFluentWrapperFunction(contextProperty);
				}
			});
		}
		
		return fluidContext;		
		
		function addFluentWrapperFunction(contextProperty) {
			return function(options) {
				if (taskGroups.length === 0) {
					series();
				}
				taskGroups[taskGroups.length-1].tasks.push(function(next) {
					contextProperty(options, function(err, res) {
						if (err) {
							next(err);
						} else {
							next(null, res);
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
						if (hasMultipleTaskGroups) {
							results.push(res);
						} else {
							results = res;
						}
						next();
					}
				})
			},function(err) {
				taskGroups = [];
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