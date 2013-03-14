function setDefaultSettings() {
    var value = localStorage["ioscompat"];
    if(!value) {
        localStorage["ioscompat"] = true;
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

setDefaultSettings();
chrome.extension.onMessage.addListener(listener);
