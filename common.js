function readCharDictionary(callback) {
    var request = new XMLHttpRequest();
	var path = "chardict.json"
	var url = chrome.extension.getURL(path);
	request.open('GET', url);
	request.onload = function(e) {
		var chars = JSON.parse(request.responseText);
		callback(chars);
	}
	request.send(null);
}
