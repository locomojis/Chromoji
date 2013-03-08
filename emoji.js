var BMP_MAX = 0xFFFF;
var ASCII_MAX = 0xFF;

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
		pattern = "[" + getAsUtf16(highMin) + "-" + getAsUtf16(highMax) + "][" + getAsUtf16(lowMin) + "-" + getAsUtf16(lowMax) + "]";
	} else {
		pattern = "[" + getAsUtf16(from) + "-" + getAsUtf16(to) + "]";
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

function getMultibyteHexString(s) {
    var result = "";
    for(var i = 0; i < s.length; i++) {
        var c1 = s.charCodeAt(i);
        if(c1 >= 0xD800 && c1 <= 0xDB7F) {
            // High surrogate
            var h = s[i] + s[i + 1];
            var c = convertStrToUtf32(h);
            result += getHexString(c);
            i++;
        } else {
            result += getHexString(c1);
        }
        result += "-";
    }
    
    if(result != "") {
        result = result.substr(0, result.length - 1);
    }
    
    return result;
}

function doReplaceNodes(regexp, nodes) {
    $.each(nodes, function(i, v) {
        var node = $(this);
        if(node && node.html()) {
            node.html(node.html().replace(regexp, 
                function(a) {
                    var hex;
                    if(a.length >= 2) {
                        hex = getMultibyteHexString(a);
                    } else {
                        hex = getHexString(a.charCodeAt(0));
                    }
                    console.log(node.html());
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
		var nodes = getBodyNodes(regexp);
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
        var chars = response.chars;
        var items = response.items;
        if(from && to) {
            for(var i = from; i <= to; i++) {
                var s = getHexString(i);
                var replacement = replacements[s];
                if(!replacement) {
                    requests++;
                    chrome.extension.sendMessage({character: s}, processImageCacheResponse);
                }
            }
        } else if (chars) {
            for(var i = 0; i < chars.length; i++) {
                var val = parseInt(chars[i]);
                var s = getHexString(val);
                requests++;
                chrome.extension.sendMessage({character: s}, processImageCacheResponse);
            }
        } else if (items) {
            for(var i = 0; i < items.length; i++) {
                var item = items[i];
                var chars = item.chars;
                var s = getMultiCharName(chars);
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

function getLocalStorageForMulti(id, items) {
    requests++;
    chrome.extension.sendMessage({setting: id, items: items}, processLocalStorageResponse);
}

var requests = 0;
var responses = 0;

function init() {	
    getCharBlocks(function(result) {
        blocks = result;
		for(var i = 0; i < blocks.length; i++) {
			var block = blocks[i];
			var start = parseInt(block.block_start);
			var from = parseInt(block.char_start);
			var to = parseInt(block.char_end);
			var id = block.id;
			getLocalStorageForBlock(id, from, to);
		}
	});
    
    getSingles(function(result) {
        singles = result;
        for(var i = 0; i < singles.length; i++) {
            var single = singles[i];
            var chars = single.chars;
            var id = single.id;
            getLocalStorageForSingle(id, chars);
        }
    });
    
    getMultis(function(result) {
        multis = result;
        for(var i = 0; i < multis.length; i++) {
            var multi = multis[i];
            var id = multi.id;
            var items = multi.items;
            getLocalStorageForMulti(id, items);
        }
    });
}

function getBodyNodes(regexp) {
    return filterNodes(document.body, regexp);
}

function filterNodes(nodes, regexp) {
    return $(nodes).find('[contenteditable!="true"][contenteditable!="plaintext-only"]').filter(
        function(index) {
            var text = $(this).justtext();
			var contents = (text.search(regexp) != 0)
			return contents;
		}
    );
}

function createSinglesPattern(singles) {
    var pattern = "";
    
    for(var i = 0; i < singles.length; i++) {
        var single = singles[i];
        var id = single.id;
        if(settings[id]) {
            var chars = single.chars;
            for(var j = 0; j < chars.length; j++) {
                var c = parseInt(chars[j]);
                var s = getAsUtf16(c);
                pattern += (s + "|");
            }
        }
    }
    
    if(pattern != "") {
        pattern = pattern.substr(0, pattern.length - 1);
    }
    
    return pattern;
}

function createMultisPattern(multis) {
    var pattern = "";
    
    for(var i = 0; i < multis.length; i++) {
        var multi = multis[i];
        var id = multi.id;
        if(settings[id]) {
            var items = multi.items;
            for(var j = 0; j < items.length; j++) {
                var item = items[j];
                var chars = item.chars;
                for(var k = 0; k < chars.length; k++) {
                    var c = parseInt(chars[k]);
                    var s = getAsUnicode(c);
                    pattern += s;
                }
                pattern += "|";
            }
        }
    }
    
    if(pattern != "") {
        pattern = pattern.substr(0, pattern.length - 1);
    }
    
    return pattern;
}

function createBlocksPattern(blocks) {
    var pattern = "";
    
    for(var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        var id = block.id;
        if(settings[id]) {
            var from = parseInt(block.char_start);
            var to = parseInt(block.char_end);
            pattern += createSearchPattern(from, to);
            pattern += "|";
        }
    }
    
    if(pattern != "") {
        pattern = pattern.substr(0, pattern.length - 1);
    }
    
    return pattern;
}

function run(nodes) {
    var regexp;
    
    if(blocks) {
        var pattern = createBlocksPattern(blocks);
		if(pattern != "") {
            regexp = new RegExp(pattern, 'g');
            if(!nodes) {
                var target = getBodyNodes(regexp);
                doReplaceNodes(regexp, target);
            } else {
                var target = filterNodes(nodes, regexp);
                doReplaceNodes(regexp, nodes);
            }
        }
    }
    
    if(singles) {
        var pattern = createSinglesPattern(singles);
        if(pattern != "") {
            regexp = new RegExp(pattern, 'g');
            if(!nodes) {
                var target = getBodyNodes(regexp);
                doReplaceNodes(regexp, target);
            } else {
                var target = filterNodes(nodes, regexp);
                doReplaceNodes(regexp, nodes);
            }
        }
    }
    
    if(multis) {
        var pattern = createMultisPattern(multis);
        if(pattern != "") {
            regexp = new RegExp(pattern, 'g');
            if(!nodes) {
                var target = getBodyNodes(regexp);
                doReplaceNodes(regexp, target);
            } else {
                var target = filterNodes(nodes, regexp);
                doReplaceNodes(regexp, nodes);
            }
        }
    }
}

function on_mutation(mutations) {
    for(var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        var added = mutation.addedNodes;
        
        if(added.length > 0) {
            if(blocks) {
                var pattern = createBlocksPattern(blocks);
                if(pattern != "") {
                    var regexp = new RegExp(pattern, 'g');
                    var target = filterNodes(added, regexp);
                    doReplaceNodes(regexp, target);
                }
            }
            
            if (singles) {
                var pattern = createSinglesPattern(singles);
                if(pattern != "") {
                    var regexp = new RegExp(pattern, 'g');
                    var target = filterNodes(added, regexp);
                    doReplaceNodes(regexp, target);
                }
            }
            
            if(multis) {
                var pattern = createMultisPattern(multis);
                if(pattern != "") {
                    regexp = new RegExp(pattern, 'g');                    
                    var target = filterNodes(added, regexp);
                    doReplaceNodes(regexp, target);
                }
            }
        }
    }
}

var blocks;
var singles;
var multis;
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

