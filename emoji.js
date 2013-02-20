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
		pattern = "([" + getAsUtf16(highMin) + "-" + getAsUtf16(highMax) + "][" + getAsUtf16(lowMin) + "-" + getAsUtf16(lowMax) + "])";
	} else {
		pattern = "([" + getAsUtf16(from) + "-" + getAsUtf16(to) + "])";
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
		var pattern = createSearchPattern(from, to);
		var regexp = new RegExp(pattern, 'g');
		s = s.replace(regexp, function(a) {
			var i = convertStrToUtf32(a);
			var path = "images/" + getHexString(i) + ".png";
			var image = chrome.extension.getURL(path);
			if(fileExists(image)) {
				console.log(path);
				return createReplacementString(i, image);
			}
			return s;
		});
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

jQuery.fn.justtext = function() {
   
    return $(this)  .clone()
            .children()
            .remove()
            .end()
            .text();
 
};

function doReplace(id, from, to)
{
	if(settings[id]) {
		var pattern = createSearchPattern(from, to);
		var regexp = new RegExp(pattern, 'g');
		var nodes = $('body').find('*').filter(function(index) {
		
			var contents = regexp.test($(this).justtext());
			return contents;
		});
		nodes.each(function(i, v) {
			$(this).html($(this).html().replace(regexp,
				function(a) {
					var i;
					if(a.length == 2) {
						i = convertStrToUtf32(a);
					} else {
						i = a.charCodeAt(0);
					}
					var path = "images/" + getHexString(i) + ".png";
					var image = chrome.extension.getURL(path);
					if(fileExists(image)) {
						return createReplacementString(i, image);
					}
					return a;
				}
			))
		});
	}
}

function getLocalStorageVal(id, from, to) {
    chrome.extension.sendMessage({greeting: id}, function(response) {
        var res = response.farewell;
		settings[id] = (res == "true" || res == "True" || res == "TRUE");
    });
}

function init() {	
    // Multi & indidual chars
	//body = replaceSpecificChars(body);
    
    // Latin-1 Supplement
    getLocalStorageVal("u80", 0x80, 0xFF);
    
    // General Punctuation
    getLocalStorageVal("u2000", 0x2000, 0x206F);
    
    // Letterlike Symbols
    getLocalStorageVal("u2139", 0x2139, 0x214F);
    
    // Arrows
    getLocalStorageVal("u2194", 0x2194, 0x21FF);
    
    // Miscellaneous Technical
    getLocalStorageVal("u2300", 0x2300, 0x23FF);
    
    // Enclosed Alphanumerics
    getLocalStorageVal("u2460", 0x2460, 0x24FF);
    
    // Geometric Shapes
    getLocalStorageVal("u25A0", 0x25A0, 0x25FF);
    
    // Miscellaneous Symbols
    getLocalStorageVal("u2600", 0x2600, 0x26FF);
    
    // Dingbats
    getLocalStorageVal("u2700", 0x2700, 0x27BF);
    
    // Supplemental Arrows-B
    getLocalStorageVal("u2900", 0x2900, 0x29FF);
    
    // Miscellaneous Symbols and Arrows
    getLocalStorageVal("u2B00", 0x2B00, 0x2BFF);
    
    // CJK Symbols and Punctuation
    getLocalStorageVal("u3000", 0x3000, 0x303F);
    
    // Enclosed CJK Letters and Months
    getLocalStorageVal("u3200", 0x3200, 0x32FF);
    
    // Enclosed Alphanumeric Supplement
    getLocalStorageVal("u1F100", 0x1F100, 0x1F1FF);
    
    // Enclosed Ideographic Supplement
    getLocalStorageVal("u1F200", 0x1F200, 0x1F2FF);
    
    // Miscellaneous Symbols and Pictographs
    getLocalStorageVal("u1F300", 0x1F300, 0x1F5FF);
    
    // Emoticons
    getLocalStorageVal("u1F600", 0x1F600, 0x1F64F);
    
    // Transport and Map Symbols
    getLocalStorageVal("u1F680", 0x1F680, 0x1F6FF);
	
	onDOMChanged('body', DOMChangedEventHandler, 1000);
}

function run() {
	// Latin-1 Supplement
    doReplace("u80", 0x80, 0xFF);
    
    // General Punctuation
    doReplace("u2000", 0x2000, 0x206F);
    
    // Letterlike Symbols
    doReplace("u2139", 0x2139, 0x214F);
    
    // Arrows
    doReplace("u2194", 0x2194, 0x21FF);
    
    // Miscellaneous Technical
    doReplace("u2300", 0x2300, 0x23FF);
    
    // Enclosed Alphanumerics
    doReplace("u2460", 0x2460, 0x24FF);
    
    // Geometric Shapes
    doReplace("u25A0", 0x25A0, 0x25FF);
    
    // Miscellaneous Symbols
    doReplace("u2600", 0x2600, 0x26FF);
    
    // Dingbats
    doReplace("u2700", 0x2700, 0x27BF);
    
    // Supplemental Arrows-B
    doReplace("u2900", 0x2900, 0x29FF);
    
    // Miscellaneous Symbols and Arrows
    doReplace("u2B00", 0x2B00, 0x2BFF);
    
    // CJK Symbols and Punctuation
    doReplace("u3000", 0x3000, 0x303F);
    
    // Enclosed CJK Letters and Months
    doReplace("u3200", 0x3200, 0x32FF);
    
    // Enclosed Alphanumeric Supplement
    doReplace("u1F100", 0x1F100, 0x1F1FF);
    
    // Enclosed Ideographic Supplement
    doReplace("u1F200", 0x1F200, 0x1F2FF);
    
    // Miscellaneous Symbols and Pictographs
    doReplace("u1F300", 0x1F300, 0x1F5FF);
    
    // Emoticons
    doReplace("u1F600", 0x1F600, 0x1F64F);
    
    // Transport and Map Symbols
    doReplace("u1F680", 0x1F680, 0x1F6FF);
}

function DOMChangedEventHandler () {
    run();
}

function onDOMChanged(selector, actionFunction, delay)
{
    $(selector).bind ('DOMSubtreeModified', fireOnDelay);

    function fireOnDelay () {
        if (typeof this.domTimer == "number") {
            clearTimeout (this.domTimer);
        }
        
        this.domTimer  = setTimeout(function() { onTimer (); }, delay);
    }

    function onTimer () {
        $(selector).unbind ('DOMSubtreeModified', fireOnDelay);
        actionFunction ();
        $(selector).bind ('DOMSubtreeModified', fireOnDelay);
    }
}

var settings = new Object();
init();