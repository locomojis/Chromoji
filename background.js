function loadImage(i) {
    var hex = getHexString(i);
    if(!images[hex]) {
        var image = getImageUrl(i);
        if(fileExists(image)) {
            images[hex] = image;
        }
    }
}

function loadImagesFromTo(from, to) {
	for(var i = from; i <= to; i++) {
        loadImage(i);
	}
}

function loadMultiImage(chars) {
    var name = getMultiCharName(chars);
    if(!images[name]) {
        var image = getImageUrlFromString(name);
        if(fileExists(image)) {
            images[name] = image;
        }
    }
}

function loadImages() {
    getCharBlocks(
        function(blocks) {
            for(var i = 0; i < blocks.length; i++) {
                var block = blocks[i];
                var name = block.name;
                console.log("Loading block:  " + name);
                var from = parseInt(block.char_start);
                var to = parseInt(block.char_end);
                loadImagesFromTo(from, to);
            }            
        }
    );
    
    getSingles(
        function(singles) {
            for(var i = 0; i < singles.length; i++) {
                var single = singles[i];
                var name = single.name;
                console.log("Loading single: " + name);
                var chars = single.chars;
                var charsLength = chars.length;
                for(var j = 0; j < charsLength; j++) {
                    var val = parseInt(chars[j]);
                    loadImage(val);
                }
            }
        }
    );
    
    getMultis(
        function(multis) {
            for(var i = 0; i < multis.length; i++) {
                var multi = multis[i];
                var name = multi.name;
                console.log("Loading multi:  " + name);
                var items = multi.items;
                for(var j = 0; j < items.length; j++) {
                    var item = items[j];
                    loadMultiImage(item.chars);
                }
            }
        }
    );
}

function listener(request, sender, sendResponse) {
    var response = $.extend(true, {}, request);
    
    if(request.setting) {
    	//Request for setting
	    var value = localStorage[request.setting];
	    if(!value) {
	        value = "false";
	    }
	    response.result = value;
	} else if(request.character) {
		// Request for image
		var image = images[request.character];
		if(!image) {
			image = "";
		}
		response.result = image;
	}
	sendResponse(response);
}

function versionCallback(currentVersion) {
	var lastVersion = localStorage["version"];
	if(lastVersion != currentVersion) {
		chrome.tabs.create({url: "options.html"});
		localStorage["version"] = currentVersion;
	}
}

chrome.extension.onMessage.addListener(listener);
getVersion(versionCallback);
var images = new Object();
loadImages();