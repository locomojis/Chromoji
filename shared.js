function getHexString(i) {
	return i.toString(16);
}

function getImageUrl(i) {
	var hex = getHexString(i);
	var path = "images/" + hex + ".png";
	return chrome.extension.getURL(path);
}

function getCharBlocks(callback) {
	var request = new XMLHttpRequest();
	request.open('GET', 'charblocks.json');
	request.onload = function(e) {
		var blocks = JSON.parse(request.responseText);
		callback(blocks);
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