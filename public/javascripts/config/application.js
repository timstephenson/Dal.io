var App,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

App = (function(_super) {

  __extends(App, _super);

  function App() {
    App.__super__.constructor.apply(this, arguments);
  }

  App.configure(function() {
    this.use("favicon", Tower.publicPath + "/favicon.png");
    this.use("static", Tower.publicPath, {
      maxAge: Tower.publicCacheDuration
    });
    if (Tower.env !== "production") this.use("profiler");
    this.use("logger");
    this.use("query");
    this.use("cookieParser", Tower.config.session.key);
    this.use("session", {
      secret: Tower.config.session.secret,
      cookie: {
        domain: Tower.config.session.cookie.domain
      }
    });
    this.use("bodyParser");
    this.use("methodOverride", "_method");
    this.use(Tower.Middleware.Agent);
    this.use(Tower.Middleware.Location);
    return this.use(Tower.Middleware.Router);
  });

  return App;

})(Tower.Application);

module.exports = global.App = new App;
