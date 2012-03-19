class App.LinksController extends App.ApplicationController
  @param "name"
  @param "deepLink"
  
  deeplink: ->
    brand = @request.headers.host.split(".")[0]
    App.Link.where(name: @params.path, subdomain: brand).first (error, record) =>
      if record
        @redirectTo record.get("deepLink")
      else
        @render "welcome"
  
###
  index: ->
    App.Link.where(@criteria()).all (error, collection) =>
      @render "index"
    
  new: ->
    resource = new App.Link
    @render "new"
    
  create: ->
    App.Link.create @params.link, (error, resource) =>
      if error
        @redirectTo "new"
      else
        @redirectTo @urlFor(resource)
    
  show:  ->
    App.Link.find @params.id, (error, resource) =>
      if resource
        @render "show"
      else
        @redirectTo "index"
    
  edit: ->
    App.Link.find @params.id, (error, resource) =>
      if resource
        @render "edit"
      else
        @redirectTo "index"
      
  update: ->
    App.Link.find @params.id (error, resource) =>
      if error
        @redirectTo "edit"
      else
        resource.updateAttributes @params.link, (error) =>
          @redirectTo @urlFor(resource)
    
  destroy: ->
    App.Link.find @params.id, (error, resource) =>
      if error
        @redirectTo "index"
      else
        resource.destroy (error) =>
          @redirectTo "index"
    
###
