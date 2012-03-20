var __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

App.LinksController = (function(_super) {

  __extends(LinksController, _super);

  function LinksController() {
    LinksController.__super__.constructor.apply(this, arguments);
  }

  LinksController.param("name");

  LinksController.param("deepLink");

  LinksController.prototype.deeplink = function() {
    var brand,
      _this = this;
    brand = this.request.headers.host.split(".")[0];
    return App.Link.where({
      name: this.params.path,
      subdomain: brand
    }).first(function(error, record) {
      if (record) {
        return _this.redirectTo(record.get("deepLink"));
      } else {
        return _this.render("welcome");
      }
    });
  };

  return LinksController;

})(App.ApplicationController);

/*
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
*/
