function loadOptions() {
	var ioscompat = document.getElementById("fieldioscompat");
	var value = localStorage["ioscompat"];
	ioscompat.checked = (value == "true");
}

function saveOptions() {
	var ioscompat = document.getElementById("fieldioscompat");
	var value = ioscompat.checked;
	localStorage["ioscompat"] = value;
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
