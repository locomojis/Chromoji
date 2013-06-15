function setDefaultSettings() {
    var value = localStorage["ioscompat"];
    if(!value) {
        localStorage["ioscompat"] = true;
    }
    
    value = localStorage["usefont"];
    if(!value) {
    	localStorage["usefont"] = false;
    }

    value = localStorage["blacklist"];
    if(!value) {
        localStorage["blacklist"] = '';
    }
}

function listener(request, sender, sendResponse) {
    var response = $.extend(true, {}, request);

    if(request.setting) {
        var value = localStorage[request.setting];
        response.result = value;
    }

    sendResponse(response);
}

function self_test() {
    readCharDictionary(
        function(dict) {
            var items = dict.items;
            for(var i = 0; i < items.length; i++) {
                var item = items[i];
                if(item.name == "") {
                    console.error(item);
                } else if(item.id == "") {
                    console.error(item);
                } else if (item.id.indexOf(' ') != -1) {
                    console.error(item);
                } else if(item.image == "") {
                    console.error(item);
                } else if (item.chars.length < 1) {
                    console.error(item);
                }
            }
            console.log("Done.");
        }
    );
}

setDefaultSettings();
chrome.extension.onMessage.addListener(listener);

if(localStorage["debug"]) {
    self_test();
}
