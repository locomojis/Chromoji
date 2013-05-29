var ioscompatname = "ioscompat";
var fieldioscompatname = "fieldioscompat";
var blacklistname = "blacklist";
var fieldblacklistname = "fieldblacklist";

function loadOptions() {
	var ioscompat = document.getElementById(fieldioscompatname);
	var value = localStorage[ioscompatname];
	ioscompat.checked = (value == "true");

	var blacklist = document.getElementById(fieldblacklistname);
	var value = localStorage[blacklistname];
	blacklist.value = value;
}

function saveOptions() {
	var ioscompat = document.getElementById(fieldioscompatname);
	var value = ioscompat.checked;
	localStorage[ioscompatname] = value;

	var blacklist = document.getElementById(fieldblacklistname);
	value = blacklist.value;
	localStorage[blacklistname] = value;

	window.close();
}

function cancelOptions() {
	window.close();
}

function init() {
	var save = document.getElementById("buttonsave");
	save.addEventListener("click", saveOptions);

	var cancel = document.getElementById("buttoncancel");
	cancel.addEventListener("click", cancelOptions);

	loadOptions();
}

document.body.addEventListener("load", init());
