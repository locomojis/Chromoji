chrome.extension.onMessage.addListener(
    function(request,sender,sendResponse) {
        var id = request.greeting;
        var res;
        if(id) {
            res = localStorage[id];
        }
        
        if(!res) {
            res = "false";
        }
        
        sendResponse({farewell: res});
    }
);

function getVersion(callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', 'manifest.json');
        xmlhttp.onload = function (e) {
            var manifest = JSON.parse(xmlhttp.responseText);
            callback(manifest.version);
        }
        xmlhttp.send(null);
}

getVersion(
	function (ver) {
		var lastVersion = localStorage["version"];
		if(lastVersion != ver) {
			chrome.tabs.create({url: "options.html"});
			localStorage["version"] = ver;
		}
	}
);