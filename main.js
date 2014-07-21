
define(function (require, exports, module) {
    "use strict";

    require("jquery.smart_autocomplete");

    var AppInit             = brackets.getModule("utils/AppInit"),
        NodeDomain          = brackets.getModule("utils/NodeDomain"),    
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        PanelManager        = brackets.getModule("view/PanelManager"),
        ProjectManager		= brackets.getModule("project/ProjectManager");


    var $icon,
    	isCordovaProject,
    	panel,
    	projectPath,
    	compiledTemplate = "",
    	platformsTemplate = require("text!templates/platforms.html"),
    	pluginsTemplate = require("text!templates/plugins.html"),
		cordovaPanelTemplate = require("text!templates/cordova_root.html");

	//Number of minutes to cache 
	var CACHE_LEN = 1000*60*60;
	//cached plugin data
	var pluginData;

    var cordovaDomain = new NodeDomain("cordovacaller", ExtensionUtils.getModulePath(module, "node/CordovaCaller"));

    //Credit: http://stackoverflow.com/a/8330107/52160
	function ucFirstAllWords( str )
	{
	    var pieces = str.split(" ");
	    for ( var i = 0; i < pieces.length; i++ )
	    {
	        var j = pieces[i].charAt(0).toUpperCase();
	        pieces[i] = j + pieces[i].substr(1);
	    }
	    return pieces.join(" ");
	}

	/*
	After we have our plugin data, setup the autocomplete
	*/
	function _initAutoComplete() {
		var options = [];
		console.dir(pluginData);
		for(var key in pluginData) {
			if(key !== '_updated') options.push(key);
		}

		$("#cordova-plugin-search").removeAttr("disabled").smartAutoComplete({
			source:options,
			maxResults:5
		});

	}

    function _initPluginData() {
    	/*
		I'm used to download and prepare the data for plugin searching.
		When I'm done I'll enable the search field.

		This URL, http://registry.cordova.io/-/all, contans a JSON packet of everything.
		We'll get it and cache it for at least one hour.
    	*/
    	var cacheKey = "camden.cordova.plugindata";
    	if(localStorage[cacheKey]) {
    		var cachedData = JSON.parse(localStorage[cacheKey]);
    		var then = new Date(cachedData.created);
			var now = new Date();
			if((now.getTime() - then.getTime()) < CACHE_LEN) {
				pluginData = cachedData.data;
				_initAutoComplete();
				return;
			}
    	}

    	$.getJSON("http://registry.cordova.io/-/all", function(res) {
    		localStorage[cacheKey] = JSON.stringify({ data:res, created:new Date()});
    		pluginData = res;
			_initAutoComplete();
    	});

    }

    function _doPlugins() {
		var $tab = $("#cordova-plugins-tab");
		$tab.html("<i>Loading data...</i>");

		cordovaDomain.exec("getPlugins",projectPath)
            .done(function (plugins) {

				var pTemplate = Mustache.render(pluginsTemplate, {plugins:plugins});
				$tab.html(pTemplate);

				_initPluginData();

				$("#cordova-plugin-add").on("click", function(e) {
					var plugin = $("#cordova-plugin-search").val();
					if(!plugin) return;
					/*
					Even though we have support for invalid plugins, let's look to our local data first.
					*/
					if(!pluginData[plugin]) {
						Dialogs.showModalDialog("", "Invalid Plugin", "The plugin you tried to add does not exist.");
						return;
					} 

					cordovaDomain.exec("addPlugin", projectPath, plugin)
					.done(function(res) {
						if(res.result && res.result == -1) {
							//bad plugin
							Dialogs.showModalDialog("", "Invalid Plugin", "The plugin you tried to add does not exist.");
						} else if(res.result == 1) {
							/*
							Good plugin. So we need to add it to the list. 
							Oddly, what you get when you run plugins list in the CLI has a slightly different name.
							For example, the device plugin is *just* device, but in the data, the description tag is
							Cordova Device Plugin. It *looks* like they may get the name from the domain, the last portion,
							and init cap the first letter and change - to space. So... I'll go with that.
							*/
							var pluginName = plugin.split(".").pop();
							pluginName = pluginName.replace(/\-/g, " ");
							pluginName = ucFirstAllWords(pluginName);
							pluginName += " ("+plugin+")";
							var version = pluginData[plugin]["dist-tags"].latest;

							$("#cordova-plugin-table tbody").append("<tr><td>"+pluginName+"</td><td>"+version+"</td><td><a class=\"removePlugin\" data-plugin=\""+plugin+"\">Remove</a></td></tr>");
							$("#cordova-plugin-search").val("");

						} else {
							//yeah ive got nothing
						}
					}).fail(function (err) {
						console.log("[cordova] Error", err);
					});					
				});

				//Remove plugin - TBD
				$tab.on("click", ".removePlugin", function(e) {
					var plugin = $(this).data("plugin");
					var tr = $(this).parent().parent();
					console.log(plugin);

					cordovaDomain.exec("removePlugin", projectPath, plugin)
					.done(function(result) {
						tr.remove();
					}).fail(function (err) {
						console.log("[cordova] Error", err);
					});
					

				});

            }).fail(function (err) {
                console.log("[cordova] Error", err);
            });

    }

    function _doPlatforms() {
		var $tab = $("#cordova-platforms-tab");
		$tab.html("<i>Loading data...</i>");
		cordovaDomain.exec("getPlatforms",projectPath)
            .done(function (platforms) {
                var platformsUnified = [];
                for(var i=0; i<platforms.installed.length; i++) {
                	platformsUnified.push({name:platforms.installed[i], enabled:true});
                }
                for(var i=0; i<platforms.available.length; i++) {
                	platformsUnified.push({name:platforms.available[i], enabled:false});
                }
				var pTemplate = Mustache.render(platformsTemplate, {platforms:platformsUnified});
				$tab.html(pTemplate);

				//Enables/Disables platforms
				$tab.find(".enablePlatform").on("click", function(e) {
					var platform = $(this).data("platform");
					var enabled = $(this).data("enabled");
					var enable = true;
					var link = $(this);
					if(enabled) enable = false;
					console.log(platform,enable);

					cordovaDomain.exec("enablePlatform", projectPath, platform, enable)
					.done(function(result) {
						if(enable) { link.text("true"); link.data("enabled", true); }
						else { link.text("false"); link.data("enabled", false); };

					}).fail(function (err) {
						console.log("[cordova] Error", err);
					});

				});

				//Emulate platforms
				$tab.find(".emulatePlatform").on("click", function(e) {
					var platform = $(this).data("platform");

					cordovaDomain.exec("emulatePlatform", projectPath, platform)
					.done(function(result) {
						//Nothing for now - maybe auto dismiss?
					}).fail(function (err) {
						console.log("[cordova] Error", err);
					});

				});

				//Run platforms
				$tab.find(".runPlatform").on("click", function(e) {
					var platform = $(this).data("platform");

					cordovaDomain.exec("runPlatform", projectPath, platform)
					.done(function(result) {
						//Nothing for now - maybe auto dismiss?
					}).fail(function (err) {
						console.log("[cordova] Error", err);
					});

				});

            }).fail(function (err) {
                console.log("[cordova] Error", err);
            });
    }

    function _launchCordovaPanel() {
    	if(!isCordovaProject) { 
        	if(panel) panel.hide();
    		return;
    	}

        var $panel = $("#cordova-root-panel");
        
        if ($panel.length == 0 || $panel.css("display") === "none") {

        	if($panel.length == 0) {
		    	if(compiledTemplate === "") $panel = $(Mustache.render(cordovaPanelTemplate, {}));
                panel = PanelManager.createBottomPanel("cordova-root-panel", $panel);
        	}


			$panel.find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
				var type = $(e.target).data("load");
				console.log("do tab "+type);
				if(type === "platforms") _doPlatforms();
				else _doPlugins();
			});

        	panel.show();
        	//TBD - remember the last one you selected
			$panel.find('.nav-tabs a:first').tab('show');

        } else {
        	panel.hide();
        }
    }

    function _checkForCordovaProject() {
    	var root = ProjectManager.getProjectRoot();
    	projectPath = root.fullPath;
    	$icon.removeClass("active").attr({title:"Not a Cordova Project"});
    	isCordovaProject = false;
    	/*
		Modified logic on Jul21:
		So apparently, .cordova isn't made all the time, or most of the time. So I'll keep it
		in, but I'm also going to use the logic of: if hooks, platforms, plugins, and www exist, it is cordova
    	*/
    	var hasCrap = { hasHooks: false, hasPlatforms: false, hasPlugins: false, hasWWW:false };

    	root.getContents(function(err,entries) {
    		entries.forEach(function(entry) {
    			if(entry.isDirectory && entry.name === ".cordova") {
			    	isCordovaProject = true;
    			}
    			if(entry.isDirectory && entry.name === "hooks") {
    				hasCrap.hasHooks = true;
    			}
    			if(entry.isDirectory && entry.name === "platforms") {
    				hasCrap.hasPlatforms = true;
    			}
    			if(entry.isDirectory && entry.name === "plugins") {
    				hasCrap.hasPlugins = true;
    			}
    			if(entry.isDirectory && entry.name === "www") {
    				hasCrap.hasWWW = true;
    			}
    		});

    		if(hasCrap.hasHooks && hasCrap.hasPlatforms && hasCrap.hasPlugins && hasCrap.hasWWW) {
		    	isCordovaProject = true;
    		}

    		if(isCordovaProject) {
    			$icon.addClass("active").attr({title:"Cordova Project"});
    		}

    		//still not cordova? auto close!
    		if(!isCordovaProject && panel) panel.hide();
    	});
    }

    ExtensionUtils.loadStyleSheet(module, "styles/ext.css");

    // Add toolbar icon 
    $icon = $("<a>")
        .attr({
            id: "cordova-setup-icon",
            href: "#"
        })
        .click(_launchCordovaPanel)
        .appendTo($("#main-toolbar .buttons"));


    AppInit.appReady(function () {
        _checkForCordovaProject();
        $(ProjectManager).on("projectOpen", _checkForCordovaProject);
    });


});