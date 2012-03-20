
Tower.Route.draw(function() {
  this.resources("links");
  this.match("/", {
    to: "application#welcome"
  });
  return this.match("(/*path)", {
    to: "links#deeplink"
  });
});
