tableFor "links", (t) ->
  t.head ->
    t.row ->
      t.header "domain", sort: false
      t.header "name", sort: false
      t.header "deepLink", sort: false
  t.body ->
    for link in @links
      t.row ->
        t.cell -> link.get("subdomain")
        t.cell -> link.get("name")
        t.cell -> link.get("deepLink")
        t.cell class: "btn-group", style: "width: 170px;", -> 
          linkTo 'Show', urlFor(link), "class": "btn"
          linkTo 'Edit', urlFor(link, action: "edit"), "class": "btn"
          linkTo 'Destroy', urlFor(link, action: "destroy"), "data-method": "delete", "data-confirm": "Are you sure?", "rel": "nofollow", "class": "btn"
  t.foot ->
    t.row ->
      t.cell colspan: 5, ->
        a href: urlFor(App.Link, action: "new"), "class": "btn btn-primary", -> '<i class="icon-plus-sign icon-white"></i> New Link'
