module.exports = function() {
	var context = {};
	var resultIndexes = {};
	
	return {
		addPlaceHolder : addPlaceHolder,
		setResult : setResult,
		getContext : function() { return context;}
	};
	
	function addPlaceHolder(propertyName) {
		var contextPropertyValue = context[propertyName];
		if (contextPropertyValue === undefined) {
			context[propertyName] = null
		} else {
			if (!(contextPropertyValue instanceof Array)) {
				context[propertyName] = [contextPropertyValue];
			}
			context[propertyName].push(null);
		}
	}
	
	function setResult(propertyName, result) {			
		registerResultAdded(propertyName);
		
		var contextPropertyValue = context[propertyName];
		if (contextPropertyValue instanceof Array) {
			context[propertyName][resultIndexes[propertyName]] = result;
		} else {
			context[propertyName] = result;
		}
	}
	
	function registerResultAdded(propertyName) {
		if (resultIndexes[propertyName] === undefined) {
			resultIndexes[propertyName] = 0;
		} else {
			resultIndexes[propertyName]++;
		}
	}
};