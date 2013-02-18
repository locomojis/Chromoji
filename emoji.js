var BMP_MAX = 0xFFFF;
var ASCII_MAX = 0xFF;

function getHexString(i) {
	return i.toString(16);
}

function getAsUtf16(i) {
	return "\\u" + getHexString(i);
}

function getMessage(i) {
	var messageName = getHexString(i);
	var message = chrome.i18n.getMessage(messageName);
	return message;
}

function getMessageMulti(first, second) {
	var messageName1 = getHexString(first);
	var messageName2 = getHexString(second);
	var messageName = messageName1 + messageName2;
	var message = chrome.i18n.getMessage(messageName);
	return message;
}

function fileExists(path){
	try {
		var HttpRequest = new XMLHttpRequest();
		HttpRequest.open("GET", path, false );
		HttpRequest.send(null);
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

function createReplacementString(i, image) {
	var message = getMessage(i);
	var replacement = "<img src='" + image + "' class='emoji' ";
    if(message.length > 0)
    {
        replacement += "alt='" + message + "' title='" + message + "' ";
    }
    replacement += "/>";
	return replacement;
}

function createReplacementStringMulti(first, second, image) {
	var message = getMessageMulti(first, second);
	var replacement = "<img src='" + image + "' alt='" + message + "' title='" + message + "' class='emoji' />";
	return replacement;
}

function getUnicodeString(i) {
	var result;
	if(i > BMP_MAX) {
		result = convertCharFromUtf32(i);
	} else if (i < ASCII_MAX) {
		result = String.fromCharCode(i);
	} else {
		result = getAsUtf16(i);
	}
	return result;
}

function replace(i, s) {
	var search = getUnicodeString(i);
	var regexp = new RegExp(search, 'g');
	var path = "images/" + getHexString(i) + ".png";
	var image = chrome.extension.getURL(path);
	var result = s;
	if(fileExists(image)) {
		var replacement = createReplacementString(i, image);
		result = s.replace(regexp, replacement);
	}
	return result;
}

function replaceMulti(first, second, s) {
	var search1 = getUnicodeString(first);
	var search2 = getUnicodeString(second);	
	var search = search1 + search2;
	var regexp = new RegExp(search, 'g');
	var path = "images/" + getHexString(first) + "-" + getHexString(second) + ".png";
	var image = chrome.extension.getURL(path);
	
	var result = s;
	if(fileExists(image)) {
		var replacement = createReplacementStringMulti(first, second, image);
		result = s.replace(regexp, replacement);
	}
	return result;
}

function checkForChars(from, to, s) {
	if(i > BMP_MAX) {
		var highMin, lowMin, highMax, lowMax;
		
		for(var i = from; i <= to; i++) {
			var low = getLowSurrogate(i);
			var high = getHighSurrogate(i);
			
			if(i == from) {
				highMin = high;
				highMax = high;
				lowMin = low;
				lowMax = low;
			} else {
				highMin = Math.min(high, highMin);
				highMax = Math.max(high, highMax);
				lowMin = Math.min(low, lowMin);
				lowMax = Math.max(low, lowMax);
			}
		}	
		
		var pattern = "[" + getAsUtf16(highMin) + "-" + getAsUtf16(highMax) + "][" + getAsUtf16(lowMin) + "-" + getAsUtf16(lowMax) + "]";
	} else {
		var pattern = "[" + getAsUtf16(from) + "-" + getAsUtf16(to) + "]";
	}
	var regexp = new RegExp(pattern);
	return regexp.test(s);
}

function getMinAndMaxSurrogates(from, to) {
	var highMin, lowMin, highMax, lowMax;
		
	for(var i = from; i <= to; i++) {
		var low = getLowSurrogate(i);
		var high = getHighSurrogate(i);
		
		if(i == from) {
			highMin = high;
			highMax = high;
			lowMin = low;
			lowMax = low;
		} else {
			highMin = Math.min(high, highMin);
			highMax = Math.max(high, highMax);
			lowMin = Math.min(low, lowMin);
			lowMax = Math.max(low, lowMax);
		}
	}
	
	var result = new Object();
	result.highMin = highMin;
	result.highMax = highMax;
	result.lowMin = lowMin;
	result.lowMax = lowMax;
	return result;
}

function createSearchPattern(from, to) {
	var pattern;
	if(from > BMP_MAX) {
		var surrogatesMinMax = 	getMinAndMaxSurrogates(from, to);
		var highMin = surrogatesMinMax.highMin;
		var lowMin = surrogatesMinMax.lowMin;
		var highMax = surrogatesMinMax.highMax;
		var lowMax = surrogatesMinMax.lowMax;
		pattern = "[" + getAsUtf16(highMin) + "-" + getAsUtf16(highMax) + "][" + getAsUtf16(lowMin) + "-" + getAsUtf16(lowMax) + "]";
	} else {
		pattern = "[" + getAsUtf16(from) + "-" + getAsUtf16(to) + "]";
	}
	return pattern;
}

function checkForChars(from, to, s) {
	var pattern = createSearchPattern(from, to);
	var regexp = new RegExp(pattern);
	return regexp.test(s);
}

function checkForCharsMulti(fromFirst, toFirst, fromSecond, toSecond, s) {
	var pattern1, pattern2;
	pattern1 = createSearchPattern(fromFirst, toFirst);
	pattern2 = createSearchPattern(fromSecond, toSecond);
	var pattern = pattern1 + pattern2;
	var regexp = new RegExp(pattern);
	return regexp.test(s);
}

function testAndReplace(from, to, s) {
	if(checkForChars(from, to, s)) {
		for(var i = from; i <= to; i++) {
			s = replace(i, s);
		}
	}
	return s;
}

function testAndReplaceMulti(fromFirst, toFirst, fromSecond, toSecond, s) {
	if(checkForCharsMulti(fromFirst, toFirst, fromSecond, toSecond, s)) {
		for(var first = fromFirst; first <= toFirst; first++) {
			for(var second = fromSecond; second <= toSecond; second++) {
				s = replaceMulti(first, second, s);
			}
		}
	}
	return s;
}

function replaceMultiChar(first, second, s) {
	s = replaceMulti(first, second, s);
	return s;
}

function replaceSpecificChars(s) {
	s = replace(0x3297, s);
	s = replace(0x3299, s);
	s = replace(0x1F004, s);
	s = replace(0x1F0CF, s);

	s = replaceMultiChar(0x1f1e8, 0x1f1f3, s);
	s = replaceMultiChar(0x1f1e9, 0x1f1ea, s);
	s = replaceMultiChar(0x1f1ea, 0x1f1f8, s);
	s = replaceMultiChar(0x1f1eb, 0x1f1f7, s);
	s = replaceMultiChar(0x1f1ec, 0x1f1e7, s);
	s = replaceMultiChar(0x1f1ee, 0x1f1f9, s);
	s = replaceMultiChar(0x1f1ef, 0x1f1f5, s);
	s = replaceMultiChar(0x1f1f0, 0x1f1f7, s);
	s = replaceMultiChar(0x1f1f7, 0x1f1fa, s);
	s = replaceMultiChar(0x1f1fa, 0x1f1f8, s);
	
	s = replaceMultiChar(0x23, 0x20E3, s);
	s = replaceMultiChar(0x30, 0x20E3, s);
	s = replaceMultiChar(0x31, 0x20E3, s);
	s = replaceMultiChar(0x32, 0x20E3, s);
	s = replaceMultiChar(0x33, 0x20E3, s);
	s = replaceMultiChar(0x34, 0x20E3, s);
	s = replaceMultiChar(0x35, 0x20E3, s);
	s = replaceMultiChar(0x36, 0x20E3, s);
	s = replaceMultiChar(0x37, 0x20E3, s);
	s = replaceMultiChar(0x38, 0x20E3, s);
	s = replaceMultiChar(0x39, 0x20E3, s);
	return s;
}

function run() {
	var body = document.body.innerHTML;
	
    // Multi & indidual chars
	body = replaceSpecificChars(body);
    
    // Latin-1 Supplement
    body = testAndReplace(0x80, 0xFF, body);
    
    // General Punctuation
    body = testAndReplace(0x2000, 0x206F, body);
    
    // Letterlike Symbols
    body = testAndReplace(0x2139, 0x214F, body);
    
    // Arrows
    body = testAndReplace(0x2194, 0x21FF, body);
    
    // Miscellaneous Technical
    body = testAndReplace(0x2300, 0x23FF, body);
    
    // Enclosed Alphanumerics
    body = testAndReplace(0x2460, 0x24FF, body);
    
    // Geometric Shapes
    body = testAndReplace(0x25A0, 0x25FF, body);
    
    // Miscellaneous Symbols
    body = testAndReplace(0x2600, 0x26FF, body);
    
    // Dingbats
    body = testAndReplace(0x2700, 0x27BF, body);
    
    // Supplemental Arrows-B
    body = testAndReplace(0x2900, 0x29FF, body);
    
    // Miscellaneous Symbols and Arrows
    body = testAndReplace(0x2B00, 0x2BFF, body);
    
    // CJK Symbols and Punctuation
    body = testAndReplace(0x3000, 0x303F, body);
    
    // Enclosed CJK Letters and Months
    body = testAndReplace(0x3200, 0x32FF, body);
    
    // Enclosed Alphanumeric Supplement
    body = testAndReplace(0x1F100, 0x1F1FF, body);
    
    // Enclosed Ideographic Supplement
    body = testAndReplace(0x1F200, 0x1F2FF, body);
    
    // Miscellaneous Symbols and Pictographs
    body = testAndReplace(0x1F300, 0x1F5FF, body);
    
    // Emoticons
	body = testAndReplace(0x1F600, 0x1F64F, body);
    
    // Transport and Map Symbols
	body = testAndReplace(0x1F680, 0x1F6FF, body);
	
	document.body.innerHTML = body;
}

run();
