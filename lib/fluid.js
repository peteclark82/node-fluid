var async = require("async");

module.exports = function(initialContext) {
	/* Builder State */
	var taskGroups = [];
	var hasMultipleTaskGroups = null;
	var executionContext = null;
	var errorDetailForNextTask = null;
	var nameForNextTask = null;
	var isDebug = false;
	/* Builder State */
	
	return withContext(initialContext);
	
	function withContext(context) {	
		var fluidContext = {
			with : withContext,
			go : executeTaskGroups,
			error : setErrorDetailForNextTask,
			name : setNameForNextTask,
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
		
		function executeTaskGroups() {
			var options = arguments.length == 2 ? arguments[0] : {};
			var callback = arguments.length == 2 ? arguments[1] : arguments[0];
			isDebug = options && options.debug ? options.debug : false;
			debug("Executing "+ taskGroups.length + " task group(s)")
			
			hasMultipleTaskGroups = taskGroups.length > 1;
			executionContext = [];
			
			async.forEachSeries(taskGroups, function(taskGroup, next) {
				debug("Executing "+ taskGroup.tasks.length +" async task(s) in : "+ taskGroup.modeType);
								
				taskGroup.mode(taskGroup.tasks, function(err) {
					if (err) { next(err); } else {
						next();
					}
				})
			},function(err) {
				var returnValue = executionContext;
				taskGroups = [];
				hasMultipleTaskGroups = null;
				executionContext = null;
				callback(err ? err : null, returnValue);
			});
		}
		
		function setErrorDetailForNextTask(error) {
			if (taskGroups.length === 0) { series(); }
			addTaskToCurrentGroup(function(next) {
				errorDetailForNextTask = error;
				next();
			});
			return fluidContext;
		}
		
		function setNameForNextTask(name) {
			if (taskGroups.length === 0) { series(); }
			addTaskToCurrentGroup(function(next) {
				nameForNextTask = name;
				next();
			});
			return fluidContext;
		}
		
		function series() {
			taskGroups.push({ modeType : "series", mode : async.series, tasks : [] });
			return fluidContext;
		}
				
		function parallel() {
			taskGroups.push({ modeType : "parallel", mode : async.parallel, tasks : [] });
			return fluidContext;
		}
		
		/* Private Methods */
		function createFluentWrapperFunction(propertyName, contextProperty) {
			return function(options) {
				if (taskGroups.length === 0) { series(); }
							
				addTaskToCurrentGroup(function(next) {				
					if (options instanceof Function) {
						options = options.call(executionContext, []);
					}
					contextProperty(options, function(err, res) {
						debug("Finished Executing '"+ propertyName + "'")
						var errorDetail = errorDetailForNextTask, name = nameForNextTask;
						errorDetailForNextTask = null; nameForNextTask = null;
						if (err) {
							if (errorDetail) {
								if (errorDetail instanceof Function) {
									err = errorDetail(err);
								} else {
									err = { message : errorDetail, error : err };
								}
							};
							next(err);
						} else {
							addResultToContext(name ? name : propertyName, res);
							next();
						}
					});
				});
				return fluidContext;
			};
		}
		
		function addTaskToCurrentGroup(task) {
			taskGroups[taskGroups.length-1].tasks.push(task);
		}
		
		function addResultToContext(propertyName, result) {			
			executionContext.push(result);
			
			var contextPropertyValue = executionContext[propertyName];
			if (contextPropertyValue === undefined) {
				executionContext[propertyName] = result
			} else {
				if (!(contextPropertyValue instanceof Array)) {
					executionContext[propertyName] = [contextPropertyValue];
				}
				executionContext[propertyName].push(result);
			}
		}
		
		function debug(message) {
			if (isDebug) { console.log(message); }
		}
	}
};