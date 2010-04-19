/**
* Borrowed from http://github.com/xilinus/prototypeui/blob/master/test/lib/event_simulate_mouse.js
* License: MIT, copyright: 2007 Sébastien Gruhier & Samuel Lebea
* 
* Ported to be used with jQuery by Elijah Insua 2010
**/
(function(window, jQuery) {

  window.MouseEvent = function(element, eventName) {
    var options = jQuery.extend({
    pointerX: 0,
    pointerY: 0,
    button:  0,
    ctrlKey:  false,
    altKey:   false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
    }, arguments[2] || { } );

    if (document.createEvent) {
      var oEvent = document.createEvent("MouseEvents");
      oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView, 
        options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, jQuery(element).get(0));
      jQuery(element).get(0).dispatchEvent(oEvent);
    }
    else {
      options.clientX = options.pointerX;
      options.clientY = options.pointerY;
      var oEvent = Object.extend(document.createEventObject(), options);
      $(element).get(0).dispatchEvent('on' + eventName, oEvent);
    }
  }
})(window, jQuery);