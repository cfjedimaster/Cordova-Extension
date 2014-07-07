
define(function (require, exports, module) {
    "use strict";

    var AppInit             = brackets.getModule("utils/AppInit"),
        NodeDomain        = brackets.getModule("utils/NodeDomain"),    
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        ProjectManager		= brackets.getModule("project/ProjectManager");


    var $icon,
    	isCordovaProject,
    	dialog,
    	projectPath,
    	compiledTemplate = "",
    	platformsTemplate = require("text!templates/platforms.html"),
		cordovaDialogTemplate = require("text!templates/cordova_root.html");

    var cordovaDomain = new NodeDomain("cordovacaller", ExtensionUtils.getModulePath(module, "node/CordovaCaller"));

    function _launchCordovaDialog() {
    	if(!isCordovaProject) return;
    	if(compiledTemplate === "") compiledTemplate = Mustache.render(cordovaDialogTemplate, {});
		dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);
		var $dialog = dialog.getElement();
		$dialog.find(".nav-tabs a:first").tab("show");

		cordovaDomain.exec("getPlatforms",projectPath)
            .done(function (platforms) {
                console.log("[cordova] Done with no errors.");
                console.dir(platforms);
                var platformsUnified = [];
                for(var i=0; i<platforms.installed.length; i++) {
                	platformsUnified.push({name:platforms.installed[i], enabled:true});
                }
                for(var i=0; i<platforms.available.length; i++) {
                	platformsUnified.push({name:platforms.available[i], enabled:false});
                }
				var pTemplate = Mustache.render(platformsTemplate, {platforms:platformsUnified});
				$dialog.find(".tab-content").html(pTemplate);

				$dialog.find(".tab-content .enablePlatform").on("click", function(e) {
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

            }).fail(function (err) {
                console.log("[cordova] Error", err);
            });
    }

    function _checkForCordovaProject() {
    	console.log("is this project a cordova project?");
    	var root = ProjectManager.getProjectRoot();
    	projectPath = root.fullPath;
    	$icon.removeClass("active").attr({title:"Not a Cordova Project"});
    	isCordovaProject = false;
    	root.getContents(function(err,entries) {
    		entries.forEach(function(entry) {
    			if(entry.isDirectory && entry.name === ".cordova") {
    				console.log("yes, it is cordova");
			    	$icon.addClass("active").attr({title:"Cordova Project"});
			    	isCordovaProject = true;
    			}
    		});
    	});
    }

    ExtensionUtils.loadStyleSheet(module, "styles/ext.css");

    // Add toolbar icon 
    $icon = $("<a>")
        .attr({
            id: "cordova-setup-icon",
            href: "#"
        })
        .click(_launchCordovaDialog)
        .appendTo($("#main-toolbar .buttons"));


    AppInit.appReady(function () {
        _checkForCordovaProject();
        $(ProjectManager).on("projectOpen", _checkForCordovaProject);
    });


});