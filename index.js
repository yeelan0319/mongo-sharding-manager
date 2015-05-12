var fs = require('fs'),
	path = require('path'),
	_ = require("underscore"),
	async = require('async'),
	rexec = require('remote-exec'),
	readline = require('readline'),
	configureRs = require('./tasks/configureRs');

var answerRegex = {
	yes: /^[Y|y]([E|e][S|s])*$/,
	no: /^[N|n]([O|o])*$/
}
var errorMsg = {
	invalidInput: function(){
		console.log("Error: Invalid Input");
	}
}
var app = {};

var mongoLogo = [];
mongoLogo.push('           |QQ.                                                                            ');
mongoLogo.push('         .QQQQQ#                                                                           ');
mongoLogo.push('        @QQQQQQQQg                                                                         '); 
mongoLogo.push('      ;QQQQQQQQQQQQ                                                                        ');
mongoLogo.push('     {QQQQQQQQQQQQQQ,                        ___    _                          _           ');
mongoLogo.push('    jQQQQQQQQQQQQQQQQ-               o O O  / __|  | |_     __ _      _ _   __| |          ');
mongoLogo.push('   -QQQQQQQQQQQQQQQQQQ              o       \\__ \\  | ` \\   / _` |    | `_| / _` |          ');
mongoLogo.push('   QQQQQQQQQQQQQQQQQQQh            TS__[O]  |___/  |_||_|  \\__,_|   _|_|_  \\__,_|          ');
mongoLogo.push('   QQQQQQQQQQQQQQQQQQQQ           {======|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|         ');
mongoLogo.push('   QQQQQQQQQQQQQQQQQQQQ          ./o--000""`-0-0-""`-0-0-""`-0-0-""`-0-0-""`-0-0-`         ');
mongoLogo.push('   QQQQQQQQQQQQQQQQQQQQ                                                                    ');
mongoLogo.push('   RQQQQQQQQQQQQQQQQQQR          __  __                            __ _                    ');        
mongoLogo.push('    @QQQQQQQQQQQQQQQQQ          |  \\/  |  __ _    _ _     __ _    / _` |   ___      _ _    ');
mongoLogo.push('     RQQQQQQQQQQQQQQQ*          | |\\/| | / _` |  | ` \\   / _` |   \\__, |  / -_)    | `_|   ');
mongoLogo.push('      RQQQQQQQQQQQQR^           |_|__|_| \\__,_|  |_||_|  \\__,_|   |___/   \\___|   _|_|_    ');
mongoLogo.push('       ^RQQQQQQQQQR             _|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|   ');
mongoLogo.push('         \\RQQQQQR               "`-0-0-""`-0-0-""`-0-0-""`-0-0-""`-0-0-""`-0-0-""`-0-0-`   ');
mongoLogo.push('           ^V^*                                                                            ');
mongoLogo.push('            @U                                                                             ');
mongoLogo.push('            B~                                       Version - 0.0.1                       ');

console.log("");
console.log(mongoLogo.join("\n\r"));
console.log("");

configureConnectionInfo();

function configureConnectionInfo(){
	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function failHandler(err){
		rl.close();
		console.log(err);	
	}

	function completeHandler(){
		rl.close();
    	console.log("Configuration! You have complete connection configuration.");
    	configureRs(app.connection_options, function(err, rs){
    		if(err){
    			return failHandler(err);
    		}
    		app.rs = rs;
    		configureConfigsvr();
    	});
	}
	console.log("=============Prerequisites=============");
	async.series({
		username: function(callback){
			var defaultUsername = "root";
			rl.question("Please specify the username that have root previlege(" + defaultUsername + "): ", function(username){
				callback(null, username? username : defaultUsername);
			});
		},
		privateKey: function(callback){
			var defaultPrivateKeyPath = process.env['HOME'] + '/.ssh/id_rsa';
			rl.question("Please specify the private key you use to login(" + defaultPrivateKeyPath + "): ", function(privateKeyPath){
				callback(null, fs.readFileSync(privateKeyPath? privateKeyPath : defaultPrivateKeyPath));
			});
		}
	}, 
	function(err, connection_options){
		if(err){
			return failHandler(err);
		}
		app.connection_options = connection_options;
		app.connection_options.port = 22;
		completeHandler();
	});
}

function configureConfigsvr(){
	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var configsvrs = [];

	console.log("=============STEP 2: Configure Config Server=============");
	runConfigsvr();

	function failHandler(err){
		rl.close();
		console.log(err);	
	}

	function completeHandler(){
		rl.close();
    	console.log("Configuration! You have started configure servers. Your configure server information is as following: ");
    	console.log(configsvrs.join('\n\r'));
    	app.configsvrs = configsvrs;
    	configureShard();
	}

	function runConfigsvr(){
		async.timesSeries(3, function(i, next){
			console.log((i+1) + " of 3 configure servers");
			async.series({
				host: function(configureConfigsvrCallback){
					rl.question("Please specify the host of the configure server: ", function(host){
						if(!host){
							return configureConfigsvrCallback(errorMsg.invalidInput());
						}
						configureConfigsvrCallback(null, host);
					});
				},
				port: function(configureConfigsvrCallback){
					rl.question("Please specify the port of the configure server: ", function(port){
						if(!port){
							return configureConfigsvrCallback(errorMsg.invalidInput());
						}
						configureConfigsvrCallback(null, port);
					});
				},
				dbpath: function(configureConfigsvrCallback){
					var defaultDbpath = "/data/configdb/";
					rl.question("Please specify data storage path. (" + defaultDbpath + "): ", function(dbpath){
						dbpath = dbpath? dbpath : defaultDbpath;
						configureConfigsvrCallback(null, dbpath);
					});
				},
				logpath: function(configureConfigsvrCallback){
					var defaultLogpath = "/var/log/mongodb_config.log";
					rl.question("Please specify log path. (" + defaultLogpath + "): ", function(logpath){
						logpath = logpath? logpath : defaultLogpath;
						configureConfigsvrCallback(null, logpath);
					});
				}
			}, function(err, config){
				if(err){
					return next(err);
				}
				var runConfigsvrScript = [
					'mkdir -p ' + config.dbpath,
					'mkdir -p ' + path.dirname(config.logpath),
					'touch ' + config.logpath,
					'mongod --fork --logappend --logpath ' + config.logpath + " --dbpath " + config.dbpath + " --port " + config.port + " --configsvr > /dev/null"
				];
				rexec(config.host, runConfigsvrScript, app.connection_options, function(err){
					if(err){
						return next(err);
					}
					configsvrs.push(config.host + ":" + config.port);
					next(null);
				});
			});
		}, function(err) {
		  	if(err){
				return failHandler(err);
			}
			completeHandler();
		});
	}
}

function configureShard(){
	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
	console.log("=============STEP 3: Configure Shard=============");

	function failHandler(err){
		rl.close();
		console.log(err);	
	}

	function completeHandler(){
		rl.close();
    	console.log("Configuration! You have successfully configure mongo shard. You can now run: ");
    	console.log("");
    	console.log("mongos " + ' --configdb ' + app.configsvrs.join(","));
    	console.log("");
    	console.log("to link to your mongo shard. Remember enableSharding on database before sharding collection");
	}

	async.series({
		host: function(configureShardCallback){
			rl.question("Please specify a host for temporary mongos router: ", function(host){
				if(!host){
					return configureShardCallback(errorMsg.invalidInput());
				}
				configureShardCallback(null, host);
			});
		},
		port: function(configureShardCallback){
			rl.question("Please specify a port for temporary mongos router: ", function(port){
				if(!port){
					return configureShardCallback(errorMsg.invalidInput());
				}
				configureShardCallback(null, port);
			});
		},
		logpath: function(configureShardCallback){
			var defaultLogpath = "/var/log/mongos.log";
			rl.question("Please specify log path. (" + defaultLogpath + "): ", function(logpath){
				logpath = logpath? logpath : defaultLogpath;
				configureShardCallback(null, logpath);
			});
		}
	}, function(err, config){
		if(err){
			return failHandler(err);
		}
		var configureShardScript = [
			'mkdir -p ' + path.dirname(config.logpath),
			'touch ' + config.logpath,
			'mongos --fork --logappend --logpath ' + config.logpath + ' --port ' + config.port + ' --configdb ' + app.configsvrs.join(",")
		];
		_.each(app.rs, function(shard){
			configureShardScript.push('mongo --port ' + config.port + ' --eval "db.runCommand(sh.addShard(\'' + shard.name + '/' + shard.member + '\'))"');
		});
		rexec(config.host, configureShardScript, app.connection_options, function(err){
			if(err){
				return failHandler(err);
			}
			completeHandler();
		});
	});
}