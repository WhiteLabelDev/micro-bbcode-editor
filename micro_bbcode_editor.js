"use strict";

/***********************************************
* Micro BBCode Editor
*
* Copyright (c) 2017 White Label Dev Ltd
* https://white-label-dev.co.uk/
*
* This Source Code Form is subject to the
* terms of the Mozilla Public License, v. 2.0.
* If a copy of the MPL was not distributed with
* this file, You can obtain one at
* https://mozilla.org/MPL/2.0/
***********************************************/

// Flag for Control key depressed
var mbbceKeyControl = false;

var mbbceToolbar = document.getElementById ("micro_bbcode_editor_toolbar"); // The top toolbar
var mbbceEditor = document.getElementById ("micro_bbcode_editor_doc"); // The editable textarea
var mbbcPreview = document.getElementById ("micro_bbcode_editor_preview"); // The preview div

// Add the colours you desire to the toolbar
for (var i = 0, j = ["black", "gray", "silver", "white", "red", "maroon", "yellow", "olive", "lime", "green", "aqua", "teal", "blue", "navy", "fuchsia", "purple"]; i < j.length; ++i)
	mbbceToolbar.innerHTML = mbbceToolbar.innerHTML + " <span style=\"background-color: " + j[i] + ";\" data-bbcode=\"color=" + j[i] + "\" title=\"" + j[i][0].toUpperCase() + j[i].slice (1) + "\">&nbsp;</span>";

// Attach click action to everything on the toolbar
for (var i = 0, j = mbbceToolbar.getElementsByTagName ("span"), k = j.length; i < k; ++i) {
	j[i].addEventListener ("click", function (e) {
		if (this.dataset && this.dataset.bbcode)
			mbbceAddTag (this.dataset.bbcode);
	}, false);
}

if (mbbceEditor.dataset && mbbceEditor.dataset.bbshortcuts && mbbceEditor.dataset.bbshortcuts == "true") {
	// When Control key pressed or keyboard shortcuts used
	document.addEventListener ("keydown", function (e) {
		if (e.which == 17) { // Control key
			mbbceKeyControl = true;
		} else if (mbbceKeyControl && (e.which == 66 || e.which == 73 || e.which == 85 || e.which == 83)) { // B|I|U|S
			mbbceAddTag (String.fromCharCode (e.which)); // FIXME Should probably check these tags are allowed
			e.preventDefault ();
		}

		return false;
	}, false);

	// When Control key released or updating preview with every change
	document.addEventListener ("keyup", function (e) {
		if (e.which == 17) {
			mbbceKeyControl = false;
		} else {
			mbbceParsePreview ();
		}

		return false;
	}, false);
}

// Move the caret and set an optional pre-selection in the textarea
mbbceEditor.focus ();
var mbbcePreSelection = (mbbceEditor.dataset && mbbceEditor.dataset.bbpreselection ? mbbceEditor.dataset.bbpreselection.replace (/ /g, "").split (",") : [mbbceEditor.value.length, mbbceEditor.value.length]); // TODO Could use 0, 0 for start of textarea
if (mbbcePreSelection.length == 2 && mbbceEditor.setSelectionRange)
	mbbceEditor.setSelectionRange (mbbcePreSelection[0], mbbcePreSelection[1]);

// Finally update the preview to any default value in the textarea
mbbceParsePreview ();

// Throws a tag around the selection or inserts it at the caret
function mbbceAddTag (tag) {
	tag = tag.trim ().toLowerCase ();
	var tagStart = "[" + tag + "]";
	var tagEnd = "[/" + tag.split ("=")[0].trim () + "]";

	mbbceEditor.focus ();
	if (mbbceEditor.selectionStart || mbbceEditor.selectionStart == 0) { // Modern browsers
		var selectionStart = mbbceEditor.selectionStart;
		var selectionEnd = mbbceEditor.selectionEnd;
		mbbceEditor.value = mbbceEditor.value.substring (0, selectionStart) + tagStart + mbbceEditor.value.substring (selectionStart, selectionEnd) + tagEnd + mbbceEditor.value.substring (selectionEnd, mbbceEditor.value.length);
		mbbceEditor.setSelectionRange (selectionStart + tagStart.length, selectionEnd + tagStart.length);
	} else if (document.selection) { // Old IE
		editorSelection = tagStart + document.selection.createRange () + tagEnd;
	} else { // Anything even older
		mbbceEditor.value += tagStart + tagEnd;
	}

	// Now update the live preview
	mbbceParsePreview ();
}

// Update the preview div
function mbbceParsePreview () {
	var editorContentText = mbbceEditor.value.replace (/&/g, "&amp;").replace (/</g, "&lt;").replace (/>/g, "&gt;").replace (/"/g, "&quot;").split ("["); // Escape the input for HTML entities and split it by BBCode tag
	var editorContentHTML = ""; // This is what will populate the preview DIV
	var editorValidator = { // Holds the state of the validator
		nest: [], // A stack of nested tags
		location: [], // The character position of each nested tag to aid debug
		position: 0, // A character pointer to populate location
		tags: (mbbceEditor.dataset && mbbceEditor.dataset.bbtags ? mbbceEditor.dataset.bbtags.replace (/ /g, "").split (",") : ["b", "i", "u", "s", "color"]), // supported BBCode tags
		message: "" // Any error message
	};

	// Define initial variables state for parsing
	var editorIndex = 0;
	var editorTag = "";
	var editorTagOpen = false;
	var editorTagProperty = [];

	// This is the main work loop, a tag-by-tag parser
	for (var i = 0, j = editorContentText.length; i < j; ++i) {
		// Cope with closing tag being found first
		editorIndex = editorContentText[i].indexOf ("]");
		if (editorIndex == -1) {
			editorContentHTML += (i > 0 ? "[" : "") + editorContentText[i];
			editorValidator.position += editorContentText[i].length + 1;
			continue;
		}

		editorTag = editorContentText[i].substring (0, editorIndex).trim (); // Get the complete tag text
		editorTagOpen = (editorTag.substring (0, 1) == "/" ? false : true); // Is it opening or closing tag?
		editorTagProperty = (editorTagOpen ? editorTag.split ("=") : []); // Extract any attribute from it
		editorTag = (editorTagOpen ? (editorTagProperty.length > 0 ? editorTagProperty[0].trim () : editorTag) : editorTag.substring (1, editorTag.length)).trim (); // Normalise tag after removing / or attribute

		// If it's not a supported tag just add it raw and skip to the next
		if (editorValidator.tags.indexOf (editorTag) == -1) {
			editorContentHTML += "[" + editorContentText[i];
			editorValidator.position += editorContentText[i].length + 1;
			continue;
		}

		if (editorTagOpen) { // New supported tag being opened
			if (editorValidator.nest.indexOf (editorTag) > -1) { // Check it wasn't previously opened
				editorValidator.message = "Tag [" + editorTag + "] is already open at character " + editorValidator.location[editorValidator.nest.indexOf (editorTag)];
				break;
			}

			// Opened ok so add tag to the stack
			editorValidator.nest.push (editorTag);
			editorValidator.location.push (editorValidator.position);
		} else { // Existing supported tag being closed
			if (editorValidator.nest[editorValidator.nest.length - 1] != editorTag) { // Check it was previously opened
				editorValidator.message = "Tag [/" + editorTag + "] being closed but " + (editorValidator.nest.length == 0 ? "it is not currently open" : "expected last opened tag [" + editorValidator.nest.pop () + "]");
				break;
			}

			// Closed ok so pop tag from the stack, Thrift Shop style
			editorValidator.nest.pop ();
			editorValidator.location.pop ();
		}

		// Render the supported tag
		editorContentHTML += "<" + (editorTagOpen ? "" : "/") + (editorTag != "color" ? editorTag : "span") + (editorTagProperty.length < 2 ? "" : " style=\"" + editorTag + ": " + editorTagProperty[1] + ";\"") + ">" + editorContentText[i].substring (editorIndex + 1, editorContentText[i].length);

		// Move the input character pointer along
		editorValidator.position += editorContentText[i].length + 1;
	}

	// Check if any unclosed tags are still in the nest
	if (editorValidator.message.length == 0 && editorValidator.nest.length > 0)
		editorValidator.message = "Unclosed tag [" + editorValidator.nest.pop () + "]";
	// FIXME Could resolve the nest to automatically close any tags still open

	// Clear the preview div
	while (mbbcPreview.hasChildNodes ())
		mbbcPreview.removeChild (mbbcPreview.lastChild);

	// Add the new preview or show the error message
	mbbcPreview.innerHTML = (editorValidator.message.length == 0 ? editorContentHTML.replace (/\n/g, "<br />") : "<span class=\"micro_bbcode_editor_error1\">Parse error at character " + editorValidator.position + ":<br />" + editorValidator.message + "</span><br />" + editorContentHTML.replace (/</g, "[").replace (/>/g, "]").replace (/\[span style="/g, "[").replace (/;"\]/g, "]").replace (/\[color: /g, "[color=") + " <span class=\"micro_bbcode_editor_error2\">&laquo;&laquo;&laquo;Problem after this</span>");
	// FIXME Re-parsing the BBCode tags back to HTML for the error preview could be done better
	// FIXME Could limit extent of returned text before a problem to show a small amount rather than entire document
}
