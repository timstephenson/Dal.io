@title = "Editing Link"

partial "form"

contentFor "sidebar", ->
  header class: "widget header", ->
    h2 @link.toLabel()