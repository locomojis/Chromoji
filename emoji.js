var BMP_MAX = 0xFFFF;
var ASCII_MAX = 0xFF;

function getMessage(i) {
	var messageName = getHexString(i);
	var message = chrome.i18n.getMessage(messageName);
	return message;
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

function getLocalStorageForBlock(id, from, to) {
	requests++;
    chrome.extension.sendMessage({setting: id, from: from, to: to}, processLocalStorageResponse);
}

function getLocalStorageForSingle(id, chars) {
    requests++;
    chrome.extension.sendMessage({setting: id, chars: chars}, processLocalStorageResponse);
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
			var id = block.id;
			getLocalStorageVal(id, from, to);
		}
	});
    
    getSingles(function(result) {
        singles = result;
        var length = singles.length;
        for(var i = 0; i < length; i++) {
            var single = singles[i];
            var chars = single.chars;
            var id = single.id;
            getLocalStorageForSingles(id, chars);
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
    
    if(singles) {
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
var singles;
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

