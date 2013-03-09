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

function getVersion(callback) {
	var request = new XMLHttpRequest();
	request.open('GET', 'manifest.json');
	request.onload = function (e) {
		var manifest = JSON.parse(request.responseText);
		callback(manifest.version);
	}
	request.send(null);
}

function fileExists(path){
	try {
		var request = new XMLHttpRequest();
		request.open("GET", path, false );
		request.send(null);
		return true;
	} catch(e) {
		return false;
	}
}
