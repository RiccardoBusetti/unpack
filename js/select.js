if (!window.Unpack) {
  Unpack = {};
}
Unpack.Selector = {};

Unpack.Selector.getSelected = function () {
  // Grab Selection
  var selection = window.getSelection();
  var text = selection.toString();
  
  return [text, selection];
}

Unpack.Selector.mouseup = function (e) {
  var sel = Unpack.Selector.getSelected();
  var text = sel[0];
  var selection = sel[1];

  console.log("Selected text " + text);
  // Check is not empty and not filled with whitespaces only
  if (text != '' && text.length > 0 && $.trim(text).length > 0) {

    // Then send the status and text to background if something is selected
    if (selection && selection.rangeCount > 0) {
      chrome.runtime.sendMessage({
        type: "handleSelection",
        text: text
      });
    }
  }
}

//  Things to do with a document ready function
$(document).ready(function () {
  // Run the text selector on mouseup
  // $(document).on("mouseup", Unpack.Selector.mouseup);
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
      case "getSelectedText":
        Unpack.Selector.mouseup();
        break;
    }
  });
});
