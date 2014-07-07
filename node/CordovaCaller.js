/*
	Just a simple proxy to calling Cordova CLI crap and converting into JSON responses.

	I'm just a bill. 
	Yes, I'm only a bill.
*/

(function () {
    "use strict";
    
    var sys = require('sys');
    var exec = require('child_process').exec;
    var spawn = require('child_process').spawn;

    function getPlatforms(directory,cb) {
    	console.log('i was passed '+directory);
    	exec("echo 'cordova platforms' | bash --login", {cwd:directory}, function(error, stdout, stderror) {
    		if(stdout && stdout != "") {
    			console.log("raw stdout ", stdout);
    			var lines = stdout.split("\n");
    			var installedPlatformsRaw = lines[0].split(": ")[1];
    			console.log("inst raw platform ", installedPlatformsRaw);
    			var platforms = installedPlatformsRaw.split(", ");
    			console.log(platforms);
    			var availPlatformsRaw = lines[1].split(": ")[1];
    			var availablePlatforms = availPlatformsRaw.split(", ");
    			console.log(availablePlatforms);
    			//return {installed:platforms, available:availablePlatforms};
    			cb(undefined, {installed:platforms, available:availablePlatforms});
    		}

    		//TBD - handle errors
    		//console.log("stderror",stderror);

    	});

    }

    function enablePlatform(directory,platform, enable, cb) {
    	console.log('i was passed '+directory+','+platform+', '+enable);
    	/*
    	platforms look like name version, im going to let them keep looking 
    	like that as i think it useful for the front end, so we'll hide em back here
    	*/
    	platform = platform.split(" ")[0];

    	var cmd;
    	if(enable) {
    		cmd = "echo 'cordova platform add "+platform+"' | bash --login";
    	} else {
    		cmd = "echo 'cordova platform rm "+platform+"' | bash --login";
    	}
    	console.log(cmd);
    	exec(cmd, {cwd:directory}, function(error, stdout, stderror) {
    		/*
			stdout for install isn't really helpful, and rm gives nothing, so...
			I'll probably regret this in the morning.
    		*/
   			var result = 1;
   			cb(undefined, {result:result});

    		//TBD - handle errors
    		if(stderror != "") console.log("stderror",stderror);

    	});

    }

    function emulatePlatform(directory,platform, cb) {
    	/*
    	platforms look like name version, im going to let them keep looking 
    	like that as i think it useful for the front end, so we'll hide em back here
    	*/
    	platform = platform.split(" ")[0];

    	var cmd = "echo 'cordova emulate "+platform+"' | bash --login";
    	console.log(cmd);
    	exec(cmd, {cwd:directory}, function(error, stdout, stderror) {
    		/*
			stdout for emulate isn't really helpful, and rm gives nothing, so...
			I'll probably regret this in the morning.
    		*/
   			var result = 1;
   			cb(undefined, {result:result});

    		//TBD - handle errors
    		if(stderror != "") console.log("stderror",stderror);

    	});

    } 

    function runPlatform(directory,platform, cb) {
    	/*
    	platforms look like name version, im going to let them keep looking 
    	like that as i think it useful for the front end, so we'll hide em back here
    	*/
    	platform = platform.split(" ")[0];

    	var cmd = "echo 'cordova run "+platform+"' | bash --login";
    	console.log(cmd);
    	exec(cmd, {cwd:directory}, function(error, stdout, stderror) {
    		/*
			stdout for emulate isn't really helpful, and rm gives nothing, so...
			I'll probably regret this in the morning.
    		*/
   			var result = 1;
   			cb(undefined, {result:result});

    		//TBD - handle errors
    		if(stderror != "") console.log("stderror",stderror);

    	});

    }        
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("cordovacaller")) {
            domainManager.registerDomain("cordovacaller", {major: 0, minor: 1});
        }
        domainManager.registerCommand(
            "cordovacaller",       // domain name
            "getPlatforms",    // command name
            getPlatforms,   // command handler function
            true,          // this command is asynchronous in Node
            "Gets platforms. What else?",
            [{name:"directory", type:"string", description:"Directory of project"}]
        );
        domainManager.registerCommand(
            "cordovacaller",       // domain name
            "enablePlatform",    // command name
            enablePlatform,   // command handler function
            true,          // this command is asynchronous in Node
            "Enables/Disables a platform",
            [{name:"directory", type:"string", description:"Directory of project"},
            {name:"platform", type:"string", description:"Platform"},
            {name:"enable", type:"boolean", description:"Either add or remove a platform"},
            ]
        );
        domainManager.registerCommand(
            "cordovacaller",       // domain name
            "emulatePlatform",    // command name
            emulatePlatform,   // command handler function
            true,          // this command is asynchronous in Node
            "Emulates a platform",
            [{name:"directory", type:"string", description:"Directory of project"},
            {name:"platform", type:"string", description:"Platform"}
            ]
        );
        domainManager.registerCommand(
            "cordovacaller",       // domain name
            "runPlatform",    // command name
            runPlatform,   // command handler function
            true,          // this command is asynchronous in Node
            "Runs a platform",
            [{name:"directory", type:"string", description:"Directory of project"},
            {name:"platform", type:"string", description:"Platform"}
            ]
        );           
    }
    
    exports.init = init;
    
}());