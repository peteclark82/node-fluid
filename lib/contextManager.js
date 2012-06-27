module.exports = function() {
	var context = {};
	var resultIndexes = {};
	
	return {
		addPlaceHolder : addPlaceHolder,
		setResult : setResult,
		getContext : function() { return context; }
	};
	
	function addPlaceHolder(propertyName) {
		if (context[propertyName] === undefined) {
			context[propertyName] = [null];
		} else {
			context[propertyName].push(null);
		}
	}
	
	function setResult(propertyName, result) {			
		if (resultIndexes[propertyName] === undefined) {
			resultIndexes[propertyName] = 0;
		} else {
			resultIndexes[propertyName]++;
		}
		context[propertyName][resultIndexes[propertyName]] = result
	}
};