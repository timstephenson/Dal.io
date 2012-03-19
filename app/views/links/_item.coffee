li class: "link", ->
  header class: "header", ->
    h3 @link.toLabel()
  dl class: "content", ->
    dt "Name:"
    dd @link.get("name")
    dt "Deep link:"
    dd @link.get("deepLink")
  footer class: "footer", ->
    menu ->
      menuItem "Edit", urlFor(@link, action: "edit")
