var __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

App.ApplicationController = (function(_super) {

  __extends(ApplicationController, _super);

  function ApplicationController() {
    ApplicationController.__super__.constructor.apply(this, arguments);
  }

  ApplicationController.layout("application");

  ApplicationController.param("path");

  ApplicationController.prototype.welcome = function() {
    this.host = this.request.headers.host;
    return this.render("welcome");
  };

  return ApplicationController;

})(Tower.Controller);
