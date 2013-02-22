function getHexString(i, addPadding) {
	var str = i.toString(16);
	var fullPad = "0000";
	var minLen = fullPad.length;
	if(addPadding && str.length < minLen) {
		var len = str.length;
		var padLen = minLen - len;
		var pad = fullPad.substr(0, padLen);
		str = pad + str;
	}
	return str;
}

function getAsUtf16(i) {
	return "\\u" + getHexString(i, true);
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