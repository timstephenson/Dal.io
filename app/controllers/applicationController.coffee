class App.ApplicationController extends Tower.Controller
  @layout "application"
  @param "path"
  
  welcome: ->
    @host = @request.headers.host
    @render "welcome"
     
