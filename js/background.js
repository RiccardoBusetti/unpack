const Base64Binary = {
  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  /* will return a  Uint8Array type */
  decodeArrayBuffer: function (input) {
    var bytes = Math.ceil((3 * input.length) / 4.0);
    var ab = new ArrayBuffer(bytes);
    this.decode(input, ab);

    return ab;
  },

  decode: function (input, arrayBuffer) {
    //get last chars to see if are valid
    var lkey1 = this._keyStr.indexOf(input.charAt(input.length - 1));
    var lkey2 = this._keyStr.indexOf(input.charAt(input.length - 1));

    var bytes = Math.ceil((3 * input.length) / 4.0);
    if (lkey1 == 64) bytes--; //padding chars, so skip
    if (lkey2 == 64) bytes--; //padding chars, so skip
    var uarray;
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var j = 0;

    if (arrayBuffer) uarray = new Uint8Array(arrayBuffer);
    else uarray = new Uint8Array(bytes);

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    for (i = 0; i < bytes; i += 3) {
      //get the 3 octects in 4 ascii chars
      enc1 = this._keyStr.indexOf(input.charAt(j++));
      enc2 = this._keyStr.indexOf(input.charAt(j++));
      enc3 = this._keyStr.indexOf(input.charAt(j++));
      enc4 = this._keyStr.indexOf(input.charAt(j++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      uarray[i] = chr1;
      if (enc3 != 64) uarray[i + 1] = chr2;
      if (enc4 != 64) uarray[i + 2] = chr3;
    }

    return uarray;
  }
}

function onPositionHover() {
  var allElemsNodeList = datadisplay.getElementsByTagName("a");
  var allElems = [];
  for (var i = 0, ii = allElemsNodeList.length; i < ii; i++) {
    allElems.push(allElemsNodeList[i]);
  }
  highlight(allElems, "");
  var coords = this.rel.split(",");
  var start = parseInt(coords[0], 10);
  var end = start + parseInt(coords[1], 10) - 1;
  highlight(allElems.filter(function (elem) {
    var indx = parseInt(elem.rel, 10);
    return indx >= start && indx <= end;
  }), "highlight");
}

// adds a byteval to the list
function displayByte(byteVal, indx) {
  var byteStr = byteVal.toString(16);
  if (byteStr.length == 1) {
    byteStr = "0" + byteStr;
  }
  var a = document.createElement("a");
  a.href = "#";
  a.id = "byte_" + indx;
  a.rel = indx;
  a.innerHTML = byteStr;
  datadisplay.appendChild(a);
}

// http://jsfromhell.com/geral/utf-8
function bufToString(buf) {
  var uint8Buff = new Uint8Array(buf);
  var byteCount = uint8Buff.byteLength;
  var output = "";
  var a, b;
  for (var i = 0; i < byteCount; i++) {
    a = uint8Buff[i];
    if (a & 0x80) {
      b = uint8Buff[i + 1];
      if (((a & 0xfc) == 0xc0) && ((b & 0xc0) == 0x80)) {
        output += String.fromCharCode(((a & 0x03) << 6) + (b & 0x3f));
      } else {
        output += String.fromCharCode(128);
        i++;
      }
    } else {
      output += String.fromCharCode(a);
    }
  }
  return output;
}

// javascript msgpack parsing taken from
// https://github.com/creationix/msgpack-js/blob/master/msgpack.js
// and then heavily tweaked to my needs
function decode(dataView) {
  var offset = 0;

  function map(length) {
    var value = {};
    for (var i = 0; i < length; i++) {
      var key = parse();
      value[key] = parse();
    }
    return value;
  }

  function raw(length) {
    var value = bufToString(dataView.buffer.slice(offset, offset + length));
    offset += length;
    return value;
  }

  function array(length) {
    var value = new Array(length);
    for (var i = 0; i < length; i++) {
      value[i] = parse();
    }
    return value;
  }

  function parse() {
    var type = dataView.getUint8(offset);
    var value, length;
    switch (type) {
      // nil
      case 0xc0:
        console.log(offset, 1, "NULL");
        offset++;
        return null;
      // false
      case 0xc2:
        console.log(offset, 1, "false");
        offset++;
        return false;
      // true
      case 0xc3:
        console.log(offset, 1, "true");
        offset++;
        return true;
      // bin 8
      case 0xc4:
        length = dataView.getUint8(offset + 1);
        var startOffset = offset;
        offset += 2;
        var result = raw(length);
        console.log(startOffset, offset - startOffset, "bin 8 marker with " + length + " items");
        return result;
      // bin 16
      case 0xc5:
        length = dataView.getUint16(offset + 1);
        var startOffset = offset;
        offset += 3;
        var result = raw(length);
        console.log(startOffset, offset - startOffset, "bin 16 marker with " + length + " items");
        return result;
      // bin 32
      case 0xc6:
        length = dataView.getUint32(offset + 1);
        var startOffset = offset;
        offset += 5;
        var result = raw(length);
        console.log(startOffset, offset - startOffset, "bin 32 marker with " + length + " items");
        return result;
      // float
      case 0xca:
        value = dataView.getFloat32(offset + 1);
        console.log(offset, 5, "float value " + value);
        offset += 5;
        return value;
      // double
      case 0xcb:
        value = dataView.getFloat64(offset + 1);
        console.log(offset, 9, "double value " + value);
        offset += 9;
        return value;
      // uint8
      case 0xcc:
        value = dataView.getUint8(offset + 1);
        console.log(offset, 2, "uint8 value " + value);
        offset += 2;
        return value;
      // uint 16
      case 0xcd:
        value = dataView.getUint16(offset + 1);
        console.log(offset, 3, "uint16 value " + value);
        offset += 3;
        return value;
      // uint 32
      case 0xce:
        value = dataView.getUint32(offset + 1);
        console.log(offset, 5, "uint32 value " + value);
        offset += 5;
        return value;
      // uint64
      case 0xcf:
        // value = buffer.readUInt64BE(offset + 1);
        console.log(offset, 9, "uint64 marker - cannot parse uint64 to javascript, setting to Infinity");
        offset += 9;
        return Infinity;
      // int 8
      case 0xd0:
        value = dataView.getInt8(offset + 1);
        console.log(offset, 2, "int8 value " + value);
        offset += 2;
        return value;
      // int 16
      case 0xd1:
        value = dataView.getInt16(offset + 1);
        console.log(offset, 3, "int16 value " + value);
        offset += 3;
        return value;
      // int 32
      case 0xd2:
        value = dataView.getInt32(offset + 1);
        console.log(offset, 5, "int32 value " + value);
        offset += 5;
        return value;
      // int 64
      case 0xd3:
        console.log(offset, 9, "int64 marker - cannot parse uint64 to javascript, setting to Infinity");
        offset += 9;
        return Infinity;
      // map 16
      case 0xde:
        length = dataView.getUint16(offset + 1);
        var startOffset = offset;
        offset += 3;
        var result = map(length);
        console.log(startOffset, offset - startOffset, "map16 marker with " + length + " items");
        return result;
      // map 32
      case 0xdf:
        length = dataView.getUint32(offset + 1);
        var startOffset = offset;
        offset += 5;
        var result = map(length);
        console.log(startOffset, offset - startOffset, "map32 marker with " + length + " items");
        return result;
      // array 16
      case 0xdc:
        length = dataView.getUint16(offset + 1);
        var startOffset = offset;
        offset += 3;
        var result = array(length);
        console.log(startOffset, offset - startOffset, "array16 marker with " + length + " items");
        return result;
      // array 32
      case 0xdd:
        length = dataView.getUint32(offset + 1);
        var startOffset = offset;
        offset += 5;
        var result = array(length);
        console.log(startOffset, offset - startOffset, "array32 marker with " + length + " items");
        return result;
      // raw 8
      case 0xd9:
        length = dataView.getUint8(offset + 1);
        var startOffset = offset;
        offset += 2;
        var result = raw(length);
        console.log(startOffset, offset - startOffset, "raw8 marker - " + result);
        return result;
      // raw 16
      case 0xda:
        length = dataView.getUint16(offset + 1);
        var startOffset = offset;
        offset += 3;
        var result = raw(length);
        console.log(startOffset, offset - startOffset, "raw16 marker - " + result);
        return result;
      // raw 32
      case 0xdb:
        length = dataView.getUint32(offset + 1);
        var startOffset = offset;
        offset += 5;
        var result = raw(length);
        console.log(startOffset, offset - startOffset, "raw32 marker - " + result);
        return result;
    }
    // FixRaw
    if ((type & 0xe0) === 0xa0) {
      length = type & 0x1f;
      var startOffset = offset;
      offset++;
      var result = raw(length);
      console.log(startOffset, offset - startOffset, "fixed length raw marker - " + result);
      return result;
    }
    // FixMap
    if ((type & 0xf0) === 0x80) {
      length = type & 0x0f;
      var startOffset = offset;
      offset++;
      var result = map(length);
      console.log(startOffset, offset - startOffset, "fixed length map marker with " + length + " items");
      return result;
    }
    // FixArray
    if ((type & 0xf0) === 0x90) {
      length = type & 0x0f;
      var startOffset = offset;
      offset++;
      var result = array(length);
      console.log(startOffset, offset - startOffset, "fixed length array marker with " + length + " items");
      return result;
    }
    // Positive FixNum
    if ((type & 0x80) === 0x00) {
      console.log(offset, 1, "postive fix length number with value " + type);
      offset++;
      return type;
    }
    // Negative Fixnum
    if ((type & 0xe0) === 0xe0) {
      value = dataView.getInt8(offset);
      console.log(offset, 1, "negative fix length number with value " + value);
      offset++;
      return value;
    }
    throw new Error("Unknown type 0x" + type.toString(16));
  }

  var value = parse();
  if (offset !== dataView.byteLength) {
    var overflow = dataView.byteLength - offset;
    console.log(overflow + " trailing bytes");
    var remainBytes = dataView.buffer.slice(offset, overflow);
    console.log("trailing chars: " + raw(overflow));
  }

  return value;
}

function parseBase64(input) {
  try {
    var buff = Base64Binary.decodeArrayBuffer(input);
    var dataView = new DataView(buff);
    return JSON.stringify(decode(dataView), null, 2);
  } catch (e) {
    console.log("Error parsing input: " + e.message);
    console.log(e.stack);
    return "";
  }
}

// Extension code.

chrome.runtime.onMessage.addListener(function (request) {
  var type = request.type;
  var text = request.text;

  switch (type) {
    case "handleSelection":
      decodeText(text);
      break;
    case "saveToClipboard":
      copyText(text);
      break;
  }
});

function decodeText(text) {
  showOptionBox(parseBase64(text));
}

function copyText(text) {
  var input = document.createElement('textarea');
  document.body.appendChild(input);

  input.value = text;
  input.focus();
  input.select();

  document.execCommand('Copy');

  input.remove();
}

function showOptionBox(text) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "showOptionBox", text: text }, function (response) {
      // Do something here?
    });
  });
}