var __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

App.Link = (function(_super) {

  __extends(Link, _super);

  function Link() {
    Link.__super__.constructor.apply(this, arguments);
  }

  Link.field("id", {
    type: "Id"
  });

  Link.field("name", {
    type: "String"
  });

  Link.field("deepLink", {
    type: "String"
  });

  Link.field("subdomain", {
    type: "String"
  });

  Link.field("brandedLink", {
    type: "String"
  });

  Link.before("save", "generateBrandedLink");

  Link.before("update", "generateBrandedLink");

  Link.prototype.generateBrandedLink = function() {
    return this.set("brandedLink", this.get("subdomain") + ".dal.io/" + this.get("name"));
  };

  Link.timestamps();

  return Link;

})(Tower.Model);
