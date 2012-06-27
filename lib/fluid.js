var async = require("async");
var contextManager = require("./contextManager.js");

module.exports = function(initialContext) {
	/* Builder State */
	var taskGroups = [];
	var executionContext = contextManager();
	var infoForNextTask = null;
	var isDebug = false;
	/* Builder State */
	
	return withContext(initialContext);
	
	function withContext(context) {	
		var fluidContext = {
			with : withContext,
			go : executeTaskGroups,
			info : info,
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
							
			async.forEachSeries(taskGroups, function(taskGroup, next) {
				debug("Executing "+ taskGroup.tasks.length +" async task(s) in : "+ taskGroup.modeType);
								
				taskGroup.mode(taskGroup.tasks, function(err) {
					if (err) { next(err); } else {
						next();
					}
				})
			},function(err) {
				var returnValue = executionContext.getContext();
				taskGroups = [];
				executionContext = null;
				callback(err ? err : null, returnValue);
			});
		}
		
		function info(name, error) {
			if (taskGroups.length === 0) { series(); }
			
			infoForNextTask = {
				name : name,
				error : error
			};
			
			addTaskToCurrentGroup(function(next) {
				infoForNextTask = {
					name : name,
					error : error
				};
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
				
				var info = infoForNextTask;	infoForNextTask = null;
				executionContext.addPlaceHolder(info && info.name ? info.name : propertyName);
				
				addTaskToCurrentGroup(function(next) {				
					if (options instanceof Function) {
						options = options.call(executionContext.getContext(), []);
					}
					contextProperty(options, function(err, res) {
						debug("Finished Executing '"+ propertyName + "'")
						
						var info = infoForNextTask; infoForNextTask = null;
						if (err) {
							if (info && info.error) {
								if (info.error instanceof Function) {
									err = info.error(err);
								} else {
									err = { message : info.error, error : err };
								}
							};
							next(err);
						} else {
							executionContext.setResult(info && info.name ? info.name : propertyName, res);
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
				
		function debug(message) {
			if (isDebug) { console.log(message); }
		}
	}
};