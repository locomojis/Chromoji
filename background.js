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

function loadImages() {
	getCharBlocks(
        function(blocks) {
            var length = blocks.length;
            for(var i = 0; i < length; i++) {
                var block = blocks[i];
                var name = block.name;
                console.log("Loading " + name);
                var from = parseInt(block.char_start);
                var to = parseInt(block.char_end);
                loadImagesFromTo(from, to);
            }            
        }
    );
    
    getSingles(
        function(singles) {
            var length = singles.length;
            for(var i = 0; i < length; i++) {
                var single = singles[i];
                var name = single.name;
                console.log("Loading " + name);
                var chars = single.chars;
                var charsLength = chars.length;
                for(var j = 0; j < charsLength; j++) {
                    var val = parseInt(chars[j]);
                    loadImage(val);
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