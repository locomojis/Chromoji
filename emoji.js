var BMP_MAX = 0xFFFF;
var ASCII_MAX = 0xFF;

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
    return $(this).clone()
            .children()
            .remove()
            .end()
            .text();
 
};

function doReplaceNodes(regexp, nodes) {
    $.each(nodes, function(i, v) {
        var node = $(this);
        if(node && node.html()) {
            node.html(node.html().replace(regexp, 
                function(a) {
                    var c;
                    if(a.length == 2) {
                        c = convertStrToUtf32(a);
                    } else {
                        c = a.charCodeAt(0);
                    }
                    var hex = getHexString(c);                    
                    var replacement = replacements[hex];
                    if(replacement) {
                        return replacement;
                    } else {
                        return a;
                    }
                })
            );
        }
    });
}

function doReplace(id, from, to)
{
	if(settings[id]) {
		var pattern = createSearchPattern(from, to);
		var regexp = new RegExp(pattern, 'g');
		var nodes = $('body').find('[contenteditable!="true"][contenteditable!="plaintext-only"]').filter(function(index) {
			var contents = regexp.test($(this).justtext());
			return contents;
		});
		doReplaceNodes(regexp, nodes);
	}
}

function processImageCacheResponse(response) {
    responses++;
    var image = response.result;
    var character = response.character
    if(image != "") {
        replacement = createReplacementString(character, image);
        replacements[character] = replacement;
    }

    if(requests == responses) {
        run();
    }
}

function processLocalStorageResponse(response) {
    responses++;
    var id = response.setting;
    var res = response.result;
    settings[id] = (res == "true" || res == "True" || res == "TRUE");
    if(settings[id]) {
        var from = response.from;
        var to = response.to;
        for(var i = from; i <= to; i++) {
            var s = getHexString(i);
            var replacement = replacements[s];
            if(!replacement) {
                requests++;
                chrome.extension.sendMessage({character: s}, processImageCacheResponse);
            }
        }
    }
}

function getLocalStorageVal(id, from, to) {
	requests++;
    chrome.extension.sendMessage({setting: id, from: from, to: to}, processLocalStorageResponse);
}

var requests = 0;
var responses = 0;

function init() {	
    getCharBlocks(function(result) {
        blocks = result;
		var length = blocks.length;
		for(var i = 0; i < length; i++) {
			var block = blocks[i];
			var start = parseInt(block.block_start);
			var from = parseInt(block.char_start);
			var to = parseInt(block.char_end);
			var id = "u" + start.toString(16).toUpperCase();
			getLocalStorageVal(id, from, to);
		}
	});
}

function run(node) {
    if(blocks) {
        var length = blocks.length;
		for(var i = 0; i < length; i++) {
			var block = blocks[i];
			var start = parseInt(block.block_start);
			var id = "u" + start.toString(16).toUpperCase();
            if(settings[id]) {
                var from = parseInt(block.char_start);
                var to = parseInt(block.char_end);
                if(node) {
                    var pattern = createSearchPattern(from, to);
                    var regexp = new RegExp(pattern, 'g');
                    doReplaceNode(id, from, to, node);
                } else {
                    doReplace(id, from, to);
                }
            }
		}
    }
}

function on_mutation(mutations) {
    var length = mutations.length;
    for(var i = 0; i < length; i++) {
        var mutation = mutations[i];
        var added = mutation.addedNodes;
        if(added && blocks) {
            var length = blocks.length;
            for(var i = 0; i < length; i++) {
                var block = blocks[i];
                var start = parseInt(block.block_start);
                var id = "u" + start.toString(16).toUpperCase();
                if(settings[id]) {
                    var from = parseInt(block.char_start);
                    var to = parseInt(block.char_end);
                    var pattern = createSearchPattern(from, to);
                    var regexp = new RegExp(pattern, 'g');
                    doReplaceNodes(regexp, added);
                }
            }
        }
    }
}

var blocks;
var settings = new Object();
var replacements = new Object();
var target = document.body;
var config = { childList: true, characterData: true, subtree: true };
var observer = new WebKitMutationObserver(on_mutation);
observer.observe(target, config);

$(document).ready(
	function() {
		init();
	}
);

