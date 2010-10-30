composer.createTerminal = function() {
 var terminal = carena.build({
    x     : 0,
    y     : composer.renderer.canvas.height-200,
    width : composer.renderer.canvas.width,
    height: 200,
    text  : composer.defaultText('terminal')
  }, [
    "carena.Node",
    "cider.Textual",
  ]),
  render = terminal.render;

  terminal.font.set(composer.defaultFont);

  terminal.render = function(renderer) {
    terminal.y = renderer.canvas.height-200;
    terminal.width = renderer.canvas.width;
    render(renderer);
  }
  return terminal;
};

