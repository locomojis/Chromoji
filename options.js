var scalename = "scale";
var fieldscalename = "fieldscale";
var ioscompatname = "ioscompat";
var fieldioscompatname = "fieldioscompat";
var usefontname = "usefont";
var fieldusefontname = "fieldusefont";
var blacklistname = "blacklist";
var fieldblacklistname = "fieldblacklist";

function loadOptions() {
	var scale = document.getElementById(fieldscalename);
	var value = localStorage[scalename];
	scale.value = value;

	var ioscompat = document.getElementById(fieldioscompatname);
	value = localStorage[ioscompatname];
	ioscompat.checked = (value == "true");

	var usefont = document.getElementById(fieldusefontname);
	value = localStorage[usefontname];
	usefont.checked = (value == "true");

	var blacklist = document.getElementById(fieldblacklistname);
	value = localStorage[blacklistname];
	blacklist.value = value;
}

function saveOptions() {
	var scale = document.getElementById(fieldscalename);
	var value = scale.value;
	localStorage[scalename] = value;

	var ioscompat = document.getElementById(fieldioscompatname);
	value = ioscompat.checked;
	localStorage[ioscompatname] = value;
	
	var usefont = document.getElementById(fieldusefontname);
	value = usefont.checked;
	localStorage[usefontname] = value;

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
