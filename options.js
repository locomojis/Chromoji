function saveOptions() {
    allCheckboxes(saveOption);
    
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "&nbsp;";
    }, 1000);
}

function loadOptions() {
    allCheckboxes(loadOption);
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
        console.log(id + " using default");
    } else {
        console.log(id + " == " + val);
    }
    
    var checkbox = document.getElementById(id);
    checkbox.checked = getBoolVal(val);
}

function getBoolVal(stringVal) {
    return stringVal == "true" || stringVal == "True" || stringVal == "TRUE";
}

function fileExists(path){
	try {
		var HttpRequest = new XMLHttpRequest();
		HttpRequest.open("GET", path, false );
		HttpRequest.send(null);
		return true;
	} catch(e) {
		return false;
	}
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

function init() {    
    //Apple logo
	setChars("0xF8FF", 0xF8FF, 0xF8FF);

	// Latin-1 Supplement
    setChars("0x80", 0xA9, 0xAE);
    
    // General Punctuation
    setChars("0x2000", 0x203C, 0x2049);
    
    // Letterlike Symbols
    setChars("0x2139", 0x2139, 0x2139);
    
    // Arrows
    setChars("0x2194", 0x2194, 0x21AA);
    
    // Miscellaneous Technical
    setChars("0x2300", 0x231A, 0x23F3);
    
    // Enclosed Alphanumerics
    setChars("0x2460", 0x24C2, 0x24C2);
    
    // Geometric Shapes
    setChars("0x25A0", 0x25AA, 0x25FE);
    
    // Miscellaneous Symbols
    setChars("0x2600", 0x2600, 0x26FD);
    
    // Dingbats
    setChars("0x2700", 0x2702, 0x27BF);
    
    // Supplemental Arrows-B
    setChars("0x2900", 0x2934, 0x2935);
    
    // Miscellaneous Symbols and Arrows
    setChars("0x2B00", 0x2B05, 0x2B55);
    
    // CJK Symbols and Punctuation
    setChars("0x3000", 0x3030, 0x303D);
    
    // Enclosed CJK Letters and Months
    setChars("0x3200", 0x3297, 0x3299);
    
    // Enclosed Alphanumeric Supplement
    setChars("0x1F100", 0x1F170, 0x1F19A);
    
    // Enclosed Ideographic Supplement
    setChars("0x1F200", 0x1F201, 0x1F251);
    
    // Miscellaneous Symbols and Pictographs
    setChars("0x1F300", 0x1F300, 0x1F5FF);
    
    // Emoticons
    setChars("0x1F600", 0x1F600, 0x1F64F);
    
    // Transport and Map Symbols
    setChars("0x1F680", 0x1F680, 0x1F6C5);
    
    loadOptions();
}

document.addEventListener('DOMContentLoaded', init);
document.querySelector('#save').addEventListener('click', saveOptions)