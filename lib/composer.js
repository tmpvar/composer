(function(window) {

  var Composer = window.Composer = {
    
    setup : function(el) {
      
      
      
      $(el).find(".toolbar li").bind( "dragstart", function( event ){
        // ref the "dragged" element, make a copy
        var $drag = $( this ), $proxy = $drag.clone();
        // modify the "dragged" source element
        $drag.addClass("outline");
        // insert and return the "proxy" element                
        return $proxy.appendTo( document.body ).addClass("dragging");
      }).bind( "drag", function( event ){
        // update the "proxy" element position
        $( event.dragProxy ).css({
        left: event.offsetX, 
        top: event.offsetY
        });
      }).bind( "dragend", function( event ){
        // remove the "proxy" element
        //$( event.dragProxy ).fadeOut( "normal", function(){
        //  $( this ).remove();
        //});
        // restore to a normal state
        $( this ).removeClass("dragging");       
      });

      $(el).find(".canvas").bind( "dropstart", function( event ){
          $(this).css({"background-color" : "red"});
          debugger;
          // don't drop in itself
          // activate the "drop" target element
          $( this ).addClass("active");
        }).bind( "drop", function( event ){
        debugger;
          // if there was a drop, move some data...
          $( this ).append( event.dragTarget ).show();
        }).bind( "dropend", function( event ){
          // deactivate the "drop" target element
          $( this ).removeClass("active");
        });    
    }
  };


})(window)
