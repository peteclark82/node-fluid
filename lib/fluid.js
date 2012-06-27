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
	
	function withContext(userContext) {	
		var fluidContext = createFluidContext(userContext);	
		return fluidContext;		
		
		function createFluidContext(context) {
			var newFluidContext = {
				with : withContext,
				go : go,
				series : createFlowMode("series", async.series),
				parallel : createFlowMode("parallel", async.parallel),
				info : info
			};
			
			if (context) {
				Object.keys(context).forEach(function(propertyName) {
					var contextProperty = context[propertyName];
					if (contextProperty instanceof Function) {
						newFluidContext[propertyName] = createWrapperMethod(propertyName, contextProperty);
					}
				});
			}
		
			return newFluidContext;
		}
		
		function go(options, callback) {
			if (arguments.length === 1) {
				callback = options; options = {};
			}
			isDebug = options && options.debug ? options.debug : false;
			logDebug("Executing "+ taskGroups.length + " task group(s)")
							
			async.forEachSeries(taskGroups, function(taskGroup, next) {
				logDebug("Executing "+ taskGroup.actualTaskCount +" async task(s) in : "+ taskGroup.modeType);
								
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
		
		function createFlowMode(name, modeFunction) {
			return function() {
				if (taskGroups.length > 0 && taskGroups[taskGroups.length-1].actualTaskCount === 0) {
					taskGroups.pop();
				}
				taskGroups.push({ modeType : name, mode : modeFunction, tasks : [], actualTaskCount : 0 });
				return fluidContext;
			};
		}
		
		function createWrapperMethod(propertyName, contextProperty) {
			return function() {		
				var args = [];
				for (var i=0; i<arguments.length; i++) { args.push(arguments[i]); }
				
				var info = getInfoForNextTask();
				var placeHolderName = info.name ? info.name : propertyName;
				var customError = info.error ? info.error : null;
				
				executionContext.addPlaceHolder(placeHolderName);
				addTaskToCurrentGroup(createMethodTask(args, contextProperty, placeHolderName, customError), true);
				
				return fluidContext;
			};
		}
		
		function createMethodTask(args, contextProperty, placeHolderName, customError) {
			return function(callback) {
				if (args[0] instanceof Function) {
					args[0] = args[0].call(executionContext.getContext(), []);
				}
				args.push(function(err, res) {
					logDebug("Finished Executing '"+ placeHolderName + "'")
					if (err) { callback(getErrorMessage(err, customError)); } else {
						executionContext.setResult(placeHolderName, res);
						callback();
					}
				});
				contextProperty.apply(null, args);
			}
		}

		function info(options) {		
			var infoDetail = { name : options.name, error : options.error };
			
			infoForNextTask = infoDetail;
			
			addTaskToCurrentGroup(function(callback) {
				infoForNextTask = infoDetail;
				callback();
			});
			
			return fluidContext;
		}
		
		function getInfoForNextTask() {
			var info = infoForNextTask ? infoForNextTask : {}; 
			infoForNextTask = null;
			return info;
		}

		function addTaskToCurrentGroup(task, isActualTask) {
			if (taskGroups.length === 0) { fluidContext.series(); }
			var taskGroup = taskGroups[taskGroups.length-1];
			
			if (isActualTask) { taskGroup.actualTaskCount++; }
			taskGroup.tasks.push(task);
		}
		
		function getErrorMessage(err, customError) {
			return customError
				? customError instanceof Function
					? customError(err)
					: { message : customError, error : err }
				: err;
		}
				
		function logDebug(message) { if (isDebug) { console.log(message); } }
	}
};