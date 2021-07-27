if (!window.Unpack) {
  Unpack = {};
}
Unpack.Selector = {};

Unpack.Selector.getSelected = function () {
  // Grab Selection
  var selection = window.getSelection();
  var text = selection.toString();
  var id = Math.random().toString(36).substring(7); // Creating random unique id
  return [text, id, selection];
}

Unpack.Selector.mouseup = function (e) {
  var sel = Unpack.Selector.getSelected();
  var text = sel[0];
  var id = sel[1];
  var selection = sel[2];

  // Check is not empty and not filled with whitespaces only
  if (text != '' && text.length > 1 && $.trim(text).length != 0) {
    if ($(e.target).is('input') || $(e.target).is('textarea')) {
      return 0;
    }

    // Then send the status and text to background
    chrome.runtime.sendMessage({
      type: "handleSelection",
      text: text
    });

    // Listen for calls from background. Specifically for option box
    chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
        if (request.type == "showOptionBox") {
          // Check if in range and then add node for popover
          if (selection && selection.rangeCount > 0) { // Add new node only if something is actually selected
            var range = selection.getRangeAt(0);
            var newNode = document.createElement("span");
            newNode.setAttribute('id', id);
            // Insert node for the pop up
            range.insertNode(newNode);
            // Create unique content for each popover
            var content = '<div><p>Copy the decoded text</p><img id="copyDecoded' + id + '" style="margin: 8px" src="' + chrome.extension.getURL('img/copy.png') + '"/></div>';
            $('#' + id).webuiPopover({ placement: 'auto', content: content, width: 200, closeable: true, trigger: "click" });
          }

          // Fire up the popover
          $("#" + id).click();

          // Trigger copy action
          $("#copyDecoded" + id).click(function () {
            chrome.runtime.sendMessage({
              type: "saveToClipboard",
              text: request.text
            });
            disablePopup(id);
          });

          // As title suggests. Ignore
          $("#ignore").click(function () {
            disablePopup(id);
          });
        }
      });
  }
}

//  Things to do with a document ready function
$(document).ready(function () {
  // Run the text selector on mouseup
  $(document).on("mouseup", Unpack.Selector.mouseup);
});

function disablePopup(id) {
  window.getSelection().empty();
  $('#' + id).webuiPopover("destroy");
}
