function loadImagesFromTo(from, to) {
	for(var i = from; i <= to; i++) {
		var image = getImageUrl(i);
		if(fileExists(image)) {
			var hex = getHexString(i);
			images[hex] = image;
		}
	}
}

function loadImages() {
	getCharBlocks(function(blocks){
		var length = blocks.length;
		for(var i = 0; i < length; i++) {
			var block = blocks[i];
			var name = block.name;
			var from = parseInt(block.char_start);
			var to = parseInt(block.char_end);
			loadImagesFromTo(from, to);
		}
	});
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