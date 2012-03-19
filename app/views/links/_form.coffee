formFor @link, (f) ->
  f.fieldset (fields) ->
    fields.field "subdomain", as: "string"
    fields.field "name", as: "string"
    fields.field "deepLink", as: "string"
  f.fieldset (fields) ->
    fields.submit "Submit"
