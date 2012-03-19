class App.Link extends Tower.Model
  @field "id",          type: "Id"
  @field "name",        type: "String"
  @field "deepLink",    type: "String"
  @field "subdomain",   type: "String"
  @field "brandedLink", type: "String"
  
  @before "save", "generateBrandedLink"
  @before "update", "generateBrandedLink"
  
  generateBrandedLink: -> 
     @set "brandedLink", @get("subdomain") + ".dal.io/" + @get("name")

       
  @timestamps()

