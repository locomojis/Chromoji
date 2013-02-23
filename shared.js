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

function getUnicode(i) {
    return i.toString(16).toUpperCase();
}

function getAsUtf16(i) {
	return "\\u" + getHexString(i, true);
}

function getImageUrl(i) {
	var hex = getHexString(i);
	var path = "images/" + hex + ".png";
	return chrome.extension.getURL(path);
}

function readChars(callback) {
    var request = new XMLHttpRequest();
	var path = "chars.json"
	var url = chrome.extension.getURL(path);
	request.open('GET', url);
	request.onload = function(e) {
		var chars = JSON.parse(request.responseText);
		callback(chars);
	}
	request.send(null);
}

function getCharBlocks(callback) {
	readChars(function(c) { callback(c.blocks); });
}

function getSingles(callback) {
	readChars(function(c) { callback(c.singles); });
}

function getMultis(callback) {
	readChars(function(c) { callback(c.multis); });
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

function convertCharFromUtf32 (i) {
	var vd = i - 0x10000;
	var vh = vd >> 10;
	var vl = vd & 0x3FF;
	var w1 = 0xD800 + vh;
	var w2 = 0xDC00 + vl;
    var s = getAsUtf16(w1) + getAsUtf16(w2);
	return s;
}

function convertStrToUtf32 (s) {
	var hi = s.charCodeAt(0);
	var lo = s.charCodeAt(1);
	var X = (hi & ((1 << 6) -1)) << 10 | lo & ((1 << 10) -1);
	var W = (hi >> 6) & ((1 << 5) - 1);
	var U = W + 1;
	var C = U << 16 | X;
	return C;
}

function getHighSurrogate(i) {
	var vd = i - 0x10000;
	var vh = vd >> 10;
	var w = 0xD800 + vh;
	return w;
}

function getLowSurrogate(i) {
	var vd = i - 0x10000;
	var vl = vd & 0x3FF;
	var w = 0xDC00 + vl;
	return w;
}