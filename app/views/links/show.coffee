@title = "Link #{@link.toLabel()}"

div class: "content", ->
  h3 "Your branded link:"
  p -> 
    a href: "http://" +  @link.get("subdomain") + ".dal.io:3000/" + @link.get("name"), 
      -> @link.get("subdomain") + ".dal.io:3000/" + @link.get("name")
  h3 "Deep link:"
  p @link.get("deepLink")
