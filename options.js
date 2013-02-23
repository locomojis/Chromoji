function saveOptions() {
    allCheckboxes(saveOption);
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "&nbsp;";
    }, 1000);
}

function loadOptions() {
    if(singles && blocks && multis) {
        allCheckboxes(loadOption);
    }
}

function allCheckboxes(callback) {
    var elements = document.getElementsByName("codepage");
    for(var i = 0; i < elements.length; i++) {
        var element = elements[i];
        callback(element.id);
    }
}

function saveOption(id) {
    var checkbox = document.getElementById(id);
    var val = checkbox.checked;
    localStorage[id] = val;
}

function loadOption(id) {
    var val = localStorage[id];
    if(!val) {
        val = false;
    }
    
    var checkbox = $('input#' + id);
    checkbox[0].checked = getBoolVal(val);
}

function getBoolVal(stringVal) {
    return stringVal == "true" || stringVal == "True" || stringVal == "TRUE";
}

function setChars(id, from, to) {
    var element = document.getElementById(id);
    element.innerHTML="";
    for(var i = from; i <= to; i++) {
        var path = "images/" + i.toString(16) + ".png";
        var image = chrome.extension.getURL(path);
        if(fileExists(path)) {
            var text = "<img src=" + path + " class='emoji' />";
            if(element != null) {
                element.innerHTML += text;
            } else {
                element.innerHTML = text;
            }
        }
    }
}

function processImageCacheResponse(response) {
    var path = response.result;
    if(path != "") {
        var div = document.getElementById("settings-" + response.id);
        var image = new Image();
        image.src = response.result;
        image.className = "emoji";
        
        var i = parseInt("0x" + response.character);
        var message = getMessage(i);
        if(message != "") {
            image.title = message;
            image.alt = message;
        }
        
        div.appendChild(image);
    }
}

function loadSingleImages() {
    for(var i = 0; i < singles.length; i++) {
        var single = singles[i];
        var id = single.id;
        
        for(var j = 0; j < single.chars.length; j++) {
            var c = single.chars[i];
            var n = parseInt(c);
            var s = getHexString(n);
            chrome.extension.sendMessage({character: s, id: id}, processImageCacheResponse);
        }
    }
}

function loadBlockImages() {
    for(var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        var id = block.id;
        
        var from = parseInt(block.char_start);
        var to = parseInt(block.char_end);
        for(var j = from; j <= to; j++) {
            var s = getHexString(j);
            chrome.extension.sendMessage({character: s, id: id}, processImageCacheResponse);
        }
    }
}

function loadBlockImages() {
    //TODO
}

function loadImages() {
    loadSingleImages();
    loadMultiImages();
    loadBlockImages()
}

function createOption(name, id, parent) {
    var div = document.createElement("div");
    div["id"] = "settings-" + id;
    div.className = "setting";
    parent.appendChild(div);

    var input = document.createElement("input");
    input["type"] = "checkbox";
    input["id"] = id;
    input["name"] = "codepage";
    
    var label = document.createElement("label");
    label["htmlFor"] = id;
    
    var labelText = document.createTextNode(name);
    label.appendChild(labelText);
    
    div.appendChild(document.createElement("br"));
    div.appendChild(input);
    div.appendChild(label);
    div.appendChild(document.createElement("br"));
}

function init() {
    options = document.getElementById("options");
}

function createCheckboxes(items) {
    var length = items.length;
    for(var i = 0; i < length; i++) {
        var item = items[i];
        var name = item.name;
        var id = item.id;
        
        createOption(name, id, options);
    }
}

function createOptions() {
    if(singles && blocks && multis) {
        createCheckboxes(singles);
        createCheckboxes(multis);
        createCheckboxes(blocks);
        loadImages();
        loadOptions();
    }
}

var singles;
var blocks;
var multis;
var options;

getSingles(
    function(s) {
        singles = s;
        createOptions();
    }
);

getCharBlocks(
    function(b) {
        blocks = b;
        createOptions();
    }
);

getMultis(
    function(m) {
        multis = m;
        createOptions();
    }
);


document.addEventListener('DOMContentLoaded', init);
document.querySelector('#save').addEventListener('click', saveOptions)