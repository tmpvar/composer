composer.chisel.filters.push(function(str, cb) {
  $.ajax({
    url      : "/chisel?q=" + str + "",
    dataType : "json",
    success  : function(data) {
      if (data) {
        for (var i=0; i<data.length; i++) {
          cb(null, {
            str : str,
            data : data[i],
            name : data[i].name,
            type : ['node', data[i].node.type]
          });
        }
      }
    },
    error: function(text) {
      cb(text);
    }
  });
});

