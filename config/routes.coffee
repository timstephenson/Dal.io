Tower.Route.draw ->
  @resources "links"
  @match "/", to: "application#welcome"
  @match "(/*path)", to: "links#deeplink"
