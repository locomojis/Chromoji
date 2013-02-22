function loadImagesFromTo(from, to) {
	for(var i = from; i <= to; i++) {
		var image = getImageUrl(i);
		if(fileExists(image)) {
			var hex = getHexString(i);
			images[hex] = image;
			console.log(hex + " = " + image);
		}
	}
}

function loadImages() {
	getCharBlocks(function(cb){
		var blocks = cb.blocks;
		var length = blocks.length;
		for(var i = 0; i < length; i++) {
			var block = blocks[i];
			var name = block.name;
			var from = parseInt(block.start);
			var to = parseInt(block.end);
			console.log("Loading " + name);
			loadImagesFromTo(from, to);
		}
	});
}

function listener(request, sender, sendResponse) {
    if(request.setting) {
    	//Request for setting
	    var value = localStorage[request.setting];
	    if(!value) {
	        value = "false";
	    }
	    sendResponse({setting: request.setting, value: value})
	} else if(request.character) {
		// Request for image
		var image = images[request.character];
		if(!image) {
			image = "";
		}
		sendResponse({character: request.character, image: image})
	}
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