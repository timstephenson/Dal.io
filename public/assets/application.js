var App,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

window.designer || (window.designer = new DesignIO("dalio", {
  port: 4181
}));

App = (function(_super) {

  __extends(App, _super);

  function App() {
    App.__super__.constructor.apply(this, arguments);
  }

  App.configure(function() {
    this.use(Tower.Middleware.Agent);
    this.use(Tower.Middleware.Location);
    return this.use(Tower.Middleware.Router);
  });

  return App;

})(Tower.Application);

window.App = new App;



Tower.Route.draw(function() {
  this.resources("links");
  this.match("/", {
    to: "application#welcome"
  });
  return this.match("(/*path)", {
    to: "links#deeplink"
  });
});



Tower.View.cache = {
  'app/views/welcome': function() {
    h1("Dal.io Makes it Easy to share Deep Access Links");
    h4("Use Dal.io to create short link aliases to pages with comples tracking codes.");
    ul(function() {
      li(function() {
        return "Before: www.raddonline.com/products/GottaGet/?utm_campaign=dalio-test&utm_source=personal&utm_medium=business-card";
      });
      return li(function() {
        return "After: radd.dal.io/get";
      });
    });
    return p(this.host);
  },
  'app/views/layouts/application': function() {
    doctype(5);
    return html(function() {
      head(function() {
        return partial("shared/meta");
      });
      body({
        role: "application"
      }, function() {
        if (hasContentFor("templates")) yields("templates");
        nav({
          id: "navigation",
          "class": "navbar navbar-fixed-top",
          role: "navigation"
        }, function() {
          return div({
            "class": "navbar-inner"
          }, function() {
            return div({
              "class": "container"
            }, function() {
              return partial("shared/navigation");
            });
          });
        });
        header({
          id: "header",
          "class": "header",
          role: "banner"
        }, function() {
          return div({
            "class": "container"
          }, function() {
            return partial("shared/header");
          });
        });
        section({
          id: "content",
          role: "main"
        }, function() {
          return div({
            "class": "container"
          }, function() {
            yields("body");
            return aside({
              id: "sidebar",
              role: "complementary"
            }, function() {
              if (hasContentFor("sidebar")) return yields("sidebar");
            });
          });
        });
        return footer({
          id: "footer",
          "class": "footer",
          role: "contentinfo"
        }, function() {
          return div({
            "class": "container"
          }, function() {
            return partial("shared/footer");
          });
        });
      });
      if (hasContentFor("popups")) {
        aside({
          id: "popups"
        }, function() {
          return yields("popups");
        });
      }
      if (hasContentFor("bottom")) return yields("bottom");
    });
  },
  'app/views/links/_form': function() {
    return formFor(this.link, function(f) {
      f.fieldset(function(fields) {
        fields.field("subdomain", {
          as: "string"
        });
        fields.field("name", {
          as: "string"
        });
        return fields.field("deepLink", {
          as: "string"
        });
      });
      return f.fieldset(function(fields) {
        return fields.submit("Submit");
      });
    });
  },
  'app/views/links/_item': function() {
    return li({
      "class": "link"
    }, function() {
      header({
        "class": "header"
      }, function() {
        return h3(this.link.toLabel());
      });
      dl({
        "class": "content"
      }, function() {
        dt("Name:");
        dd(this.link.get("name"));
        dt("Deep link:");
        return dd(this.link.get("deepLink"));
      });
      return footer({
        "class": "footer"
      }, function() {
        return menu(function() {
          return menuItem("Edit", urlFor(this.link, {
            action: "edit"
          }));
        });
      });
    });
  },
  'app/views/links/_list': function() {
    return ol({
      "class": "links"
    }, function() {
      return partial("item", {
        collection: this.links
      });
    });
  },
  'app/views/links/_table': function() {
    return tableFor("links", function(t) {
      t.head(function() {
        return t.row(function() {
          t.header("domain", {
            sort: false
          });
          t.header("name", {
            sort: false
          });
          return t.header("deepLink", {
            sort: false
          });
        });
      });
      t.body(function() {
        var link, _i, _len, _ref, _results;
        _ref = this.links;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          link = _ref[_i];
          _results.push(t.row(function() {
            t.cell(function() {
              return link.get("subdomain");
            });
            t.cell(function() {
              return link.get("name");
            });
            t.cell(function() {
              return link.get("deepLink");
            });
            return t.cell({
              "class": "btn-group",
              style: "width: 170px;"
            }, function() {
              linkTo('Show', urlFor(link), {
                "class": "btn"
              });
              linkTo('Edit', urlFor(link, {
                action: "edit"
              }), {
                "class": "btn"
              });
              return linkTo('Destroy', urlFor(link, {
                action: "destroy"
              }), {
                "data-method": "delete",
                "data-confirm": "Are you sure?",
                "rel": "nofollow",
                "class": "btn"
              });
            });
          }));
        }
        return _results;
      });
      return t.foot(function() {
        return t.row(function() {
          return t.cell({
            colspan: 5
          }, function() {
            return a({
              href: urlFor(App.Link, {
                action: "new"
              }),
              "class": "btn btn-primary"
            }, function() {
              return '<i class="icon-plus-sign icon-white"></i> New Link';
            });
          });
        });
      });
    });
  },
  'app/views/links/edit': function() {
    this.title = "Editing Link";
    partial("form");
    return contentFor("sidebar", function() {
      return header({
        "class": "widget header"
      }, function() {
        return h2(this.link.toLabel());
      });
    });
  },
  'app/views/links/index': function() {
    this.title = "Listing links";
    return partial("table");
  },
  'app/views/links/new': function() {
    this.title = "New Link";
    return partial("form");
  },
  'app/views/links/show': function() {
    this.title = "Link " + (this.link.toLabel());
    return div({
      "class": "content"
    }, function() {
      h3("Your branded link:");
      p(function() {
        return a({
          href: "http://" + this.link.get("subdomain") + ".dal.io:3000/" + this.link.get("name")
        }, function() {
          return this.link.get("subdomain") + ".dal.io:3000/" + this.link.get("name");
        });
      });
      h3("Deep link:");
      return p(this.link.get("deepLink"));
    });
  },
  'app/views/shared/_footer': function() {
    return cite({
      "class": "copyright"
    }, function() {
      span("&copy;");
      a({
        href: "mailto:tim@raddonline.com"
      }, function() {
        return t("author");
      });
      return span("" + (t("year")) + ".");
    });
  },
  'app/views/shared/_header': function() {
    return h1({
      id: "title"
    }, function() {
      return t("title");
    });
  },
  'app/views/shared/_meta': function() {
    meta({
      charset: "utf-8"
    });
    if (hasContentFor("title")) {
      title(this.title);
    } else {
      title(t("title"));
    }
    meta({
      name: "description",
      content: t("description")
    });
    meta({
      name: "keywords",
      content: t("keywords")
    });
    meta({
      name: "robots",
      content: t("robots")
    });
    meta({
      name: "author",
      content: t("author")
    });
    csrfMetaTag();
    appleViewportMetaTag({
      width: "device-width",
      max: 1,
      scalable: false
    });
    stylesheets("lib", "vendor", "application");
    link({
      href: "/favicon.png",
      rel: "icon shortcut-icon favicon"
    });
    javascriptTag("https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js");
    javascriptTag("/javascripts/jquery_ujs.js");
    return contentFor("bottom", function() {
      javascripts("vendor");
      if (Tower.env === "development") javascripts("development");
      return javascripts("lib", "application");
    });
  },
  'app/views/shared/_navigation': function() {
    linkTo(t("title"), "/", {
      "class": "brand"
    });
    return div({
      "class": "nav-collapse"
    }, function() {
      ul({
        "class": "nav"
      }, function() {
        return navItem(t("links.links"), urlFor(App.Link));
      });
      return ul({
        "class": "nav pull-right"
      }, function() {
        return li({
          "class": "dropdown"
        }, function() {
          linkTo(t("links.docs"), "#", {
            "class": "dropdown-toggle",
            "data-toggle": "dropdown"
          }, function() {
            return b({
              "class": "caret"
            });
          });
          return ul({
            "class": "dropdown-menu"
          }, function() {
            return li(function() {
              return linkTo("Tower.js", "http://towerjs.org");
            });
          });
        });
      });
    });
  },
  'app/views/shared/_sidebar': function() {}
};


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


var __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

App.LinksController = (function(_super) {

  __extends(LinksController, _super);

  function LinksController() {
    LinksController.__super__.constructor.apply(this, arguments);
  }

  return LinksController;

})(Tower.Controller);


