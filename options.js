function saveOptions() {
    saveOption("u80");
    saveOption("u2000");
    saveOption("u2139");
    saveOption("u2194");
    saveOption("u2300");
    saveOption("u2460");
    saveOption("u25A0");
    saveOption("u2600");
    saveOption("u2700");
    saveOption("u2900");
    saveOption("u2B00");
    saveOption("u3000");
    saveOption("u3200");
    saveOption("u1F100");
    saveOption("u1F200");
    saveOption("u1F300");
    saveOption("u1F600");
    saveOption("u1F680");
    
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "&nbsp;";
    }, 750);
}

function loadOptions() {
    loadOption("u80");
    loadOption("u2000");
    loadOption("u2139");
    loadOption("u2194");
    loadOption("u2300");
    loadOption("u2460");
    loadOption("u25A0");
    loadOption("u2600");
    loadOption("u2700");
    loadOption("u2900");
    loadOption("u2B00");
    loadOption("u3000");
    loadOption("u3200");
    loadOption("u1F100");
    loadOption("u1F200");
    loadOption("u1F300");
    loadOption("u1F600");
    loadOption("u1F680");
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
    setChars("0x80", 0x80, 0xFF);
    setChars("0x2000", 0x2000, 0x206F);
    setChars("0x2139", 0x2139, 0x214F);
    setChars("0x2194", 0x2194, 0x21FF);
    setChars("0x2300", 0x2300, 0x23FF);
    setChars("0x2460", 0x2460, 0x24FF);
    setChars("0x25A0", 0x25A0, 0x25FF);
    setChars("0x2600", 0x2600, 0x26FF);
    setChars("0x2700", 0x2700, 0x27BF);
    setChars("0x2900", 0x2900, 0x29FF);
    setChars("0x2B00", 0x2B00, 0x2BFF);
    setChars("0x3000", 0x3000, 0x303F);
    setChars("0x3200", 0x3200, 0x32FF);
    setChars("0x1F100", 0x1F100, 0x1F1FF);
    setChars("0x1F200", 0x1F200, 0x1F2FF);
    setChars("0x1F300", 0x1F300, 0x1F5FF);
    setChars("0x1F600", 0x1F600, 0x1F64F);
    setChars("0x1F680", 0x1F680, 0x1F6FF);
    
    loadOptions();
}

document.addEventListener('DOMContentLoaded', init);
document.querySelector('#save').addEventListener('click', saveOptions)