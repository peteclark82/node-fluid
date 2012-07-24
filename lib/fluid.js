var async = require("async");
var contextManager = require("./contextManager.js");

module.exports = function(initialContext) {
	if (typeof(initialContext) == "string") {
		return new FluidArgHandler(initialContext);	
	}
	
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
			newFluidContext = function(options) { return info(options); }
			newFluidContext.with = withContext;
			newFluidContext.go = go;
			newFluidContext.series = createFlowMode("series", async.series);
			newFluidContext.parallel = createFlowMode("parallel", async.parallel);
			newFluidContext.info = info;
			newFluidContext.custom = custom;
			
			if (context) {
				newFluidContext.self = createWrapperMethod("self", context)
				Object.keys(context).forEach(function(propertyName) {
					var contextProperty = context[propertyName];
					if (contextProperty instanceof Function) {
						var fluidContextPropertyName = newFluidContext[propertyName] ? "_"+ propertyName : propertyName;
						newFluidContext[fluidContextPropertyName] = createWrapperMethod(propertyName, contextProperty);
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
				resolveArguments(placeHolderName, args, function(err, resolvedArgs) {
					if (err) { callback(err); } else {
						resolvedArgs.push(function(err, res) {
							logDebug("Finished Executing '"+ placeHolderName + "'")
							if (err) { callback(getErrorMessage(err, customError)); } else {
								executionContext.setResult(placeHolderName, res);
								callback();
							}
						});
						contextProperty.apply(executionContext.getContext(), resolvedArgs);
					}
				});
			}
		}
		
		function resolveArguments(placeHolderName, args, callback) {
			async.map(args, function(arg, next) {
				resolveArgument(placeHolderName, arg, function(err, resolvedArg) {
					if (err) { callback(err); } else {
						next(null, resolvedArg);
					}
				});
			}, function(err, resolvedArgs) {
				if (err) {callback(err) } else {
					callback(null, resolvedArgs);
				}
			});
		}
		
		function resolveArgument(placeHolderName, arg, callback) {
			if (arg instanceof FluidArgHandler) {
				try {
					var resolvedArg = arg.getValue(placeHolderName, executionContext.getContext());
					callback(null, resolvedArg);
				} catch(e) {
					callback({
						message : "Error resolving argument",
						error : e.toString()
					});
				}
			} else if (arg instanceof Object) {
				var resolvedArgObject = {};
				async.forEach(Object.keys(arg), function(propName, next) {
					if (arg[propName] instanceof FluidArgHandler) {
						try {
							resolvedArgObject[propName] = arg[propName].getValue(placeHolderName, executionContext.getContext());
							next();
						} catch(e) {
							callback({
								message : "Error resolving argument",
								error : e.toString()
							});
						}
					} else {
						resolvedArgObject[propName] = arg[propName];
						next();
					}
				}, function(err) {
					if (err) { callback(err); } else {
						callback(null, resolvedArgObject);
					}
				});
			} else {
				callback(null, arg);
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
		
		function custom(customCallback) {
			return createWrapperMethod("custom", customCallback)();
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

function FluidArgHandler(expression) {
	this.getValue = function(placeHolderName, context) {
		var value = null;
		try {
			value = executor.apply(context, []);
			return value;
		} catch(e) {
			throw new Error("Error evaluating expression for property '"+ placeHolderName +"' : "+ expression + "\n"+ e);
		}
	};
	
	function executor() {
		var ret = null;
		eval("ret = "+ expression);
		return ret;
	}
}