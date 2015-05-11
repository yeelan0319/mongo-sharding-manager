var fs = require('fs'),
	async = require('async'),
	rexec = require('remote-exec'),
	readline = require('readline'),
	_ = require("underscore"),
	path = require('path');

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
mongoLogo.push("#@##################################################");
mongoLogo.push("#@S                                              S@#");
mongoLogo.push("#@S                      {Q~                     S@#");
mongoLogo.push("#@S                    -@#MM>                    S@#");
mongoLogo.push("#@S                  -@#S#MSSM-                  S@#");
mongoLogo.push("#@S                 ]@SSSSMSSSSM                 S@#");
mongoLogo.push("#@S                ]SSSSSSMSSSSSM-               S@#");
mongoLogo.push("#@S               |SSSSSSSMSSSSSSS~              S@#");
mongoLogo.push("#@S              .@SSSSSSSSSSSSSSSS              S@#");
mongoLogo.push("#@S              |SSSSSSSSSSSSSSSSS-             S@#");
mongoLogo.push("#@S              |SSSSSSSSSSSSSSSSSo             S@#");
mongoLogo.push("#@S              |SSSSSSSSSSSSSSSSSD             S@#");
mongoLogo.push("#@S              |SSSSSSSSSSSSSSSSS-             S@#");
mongoLogo.push("#@S              'SSSSSSSSSSSSSSSSU              S@#");
mongoLogo.push("#@S               'SSSSSSSSSSSSSSS-              S@#");
mongoLogo.push("#@S                'SSSSSSSSSSSSS^               S@#");
mongoLogo.push("#@S                  TSSSSSSSSSB                 S@#");
mongoLogo.push("#@S                    BSS@SSB^                  S@#");
mongoLogo.push("#@S                      S#O^                    S@#");
mongoLogo.push("#@S                       @U                     S@#");
mongoLogo.push("#@S                       B~                     S@#");
mongoLogo.push("##S                                              S@S");
mongoLogo.push("#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@##");

console.log(mongoLogo.join("\n\r"));
console.log("Shard Manager Version - 0.0.1");
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
    	configureRs();
	}
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

function configureRs(){
	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var rs = [];

	console.log("=============STEP 1: Configure Replica Set=============");
	addRs();

	function failHandler(err){
		rl.close();
		console.log(err);	
	}

	function completeHandler(){
		rl.close();
    	console.log("Configuration! You have complete shard configuration. Your shard configuration is as following: ");
    	console.log(rs);
    	app.rs = rs;
    	configureConfigsvr();
	}

	function addRs(){
		rl.question("Do you already have the replica set running? (Yes) ", function(answer) {
			if(answerRegex.yes.test(answer) || answer === ''){
		    	addExistingRs();
		    }
		    else if(answerRegex.no.test(answer)){
		    	createRs();
		    }
		    else{
				errorMsg.invalidInput();
				addRs();
		    }
		});
	}
	function createRs(){
		async.waterfall([
			function(createRsCallback){
				var config = {};
				var defaultName = "rs" + rs.length;
				rl.question("Please name the replica set(" + defaultName + "): ", function(name){
					config.name = name? name : defaultName;
					createRsCallback(null, config);
				});
			},
			function(config, createRsCallback){
				rl.question("Please specify the host:port running as primary member of the replica set: ", function(primary){
					if(!primary){
						callback(errorMsg.invalidInput());
					}
					config.primary = primary;
					createRsCallback(null, config);
				});
			},
			function(config, createRsCallback){
				async.timesSeries(2, function(i, next){
					console.log((i+1) + " of 2 secondary members");
					rl.question("Please specify the host:port running as secondary member of the replica set: ", function(secondary){
						if(!secondary){
							createRsCallback(errorMsg.invalidInput());
						}
						next(null, secondary);
					});
				}, function(err, secondary) {
				  	if(err){
						createRsCallback(err);
					}
					config.secondary = secondary;
					createRsCallback(null, config);
				});
			},
			function(config, createRsCallback){
				var defaultDbpath = "/data/" + config.name + "/";
				rl.question("Please specify data storage path. (" + defaultDbpath + "): ", function(dbpath){
					config.dbpath = dbpath? dbpath : defaultDbpath;
					createRsCallback(null, config);
				});
			},
			function(config, createRsCallback){
				var defaultLogpath = "/var/log/mongodb_" + config.name + ".log";
				rl.question("Please specify log path. (" + defaultLogpath + "): ", function(logpath){
					config.logpath = logpath? logpath : defaultLogpath;
					createRsCallback(null, config);
				});
			}
		], 
		function(err, config){
			if(err){
				return failHandler(err);
			}
			runRs(config, function(err, config){
				if(err){
					return failHandler(err);
				}
				var rsConf = {
					name: config.name,
					member: config.primary
				};
				rs.push(rsConf);
				addMore();
			});	
		});
	}

	function runRs(config, callback){
		console.log("Starting replica set " + config.name + "...");
		// host info
		var members = [];
		var temp = config.primary.split(":");
		members.push({
			host: temp[0],
			port: temp[1]
		});
		for(var i = 0; i < 2; i++){
			temp = config.secondary[i].split(":");
			members.push({
				host: temp[0],
				port: temp[1]
			});
		};

		async.series([
			function(runRsCallback){
				async.timesSeries(members.length, function(i, next){
					console.log("Start mongod on host " + members[i].host + "...");
					var prepareRsScript = [
						'mkdir -p ' + config.dbpath,
						'mkdir -p ' + path.dirname(config.logpath),
						'touch ' + config.logpath,
						'mongod  --fork --replSet ' + config.name + " --logappend --logpath " + config.logpath + " --dbpath " + config.dbpath + " --port " + members[i].port + " --shardsvr > /dev/null"
					];
					rexec(members[i].host, prepareRsScript, app.connection_options, function(err){
						if(err){
							return next(err);
						}
						next();
					});
				}, function(err){
					if(err){
						return runRsCallback(err);
					}
					runRsCallback(null);
				});
			},
			function(runRsCallback){
				var rsConfig = {
					_id: config.name,
					members: []
				}
				_.each(members, function(member, i){
					rsConfig.members.push({
						host: member.host + ":" + member.port
					});
				});
				var configureRsScript = [
					'mongo --port ' + members[0].port + ' --eval "db.runCommand(rs.initiate(' + JSON.stringify(rsConfig) + '))"',
					'mongo --eval "db.runCommand(rs.status())"'
				]
				rexec(members[0].host, configureRsScript, app.connection_options, function(err){
					if(err){
						runRsCallback(err);
					}
					runRsCallback(null);
				});
			}
		], function(err){
			if(err){
				return failHandler(err);
			}
			console.log("Replica Set " + config.name + " started successfully!")
			callback(null, config);
		});
	}
	function addExistingRs(){
		async.series({
			name: function(callback){
				rl.question("Please specify the name of the replica set: ", function(name){
					callback(null, name);
				});
			},
			member: function(callback){
				rl.question("Please specify the member(host:port) of the replica set: ", function(member){
					callback(null, member);
				});
			}
		}, 
		function(err, rsConf){
			if(err){
				return failHandler(err);
			}
			rs.push(rsConf);
			addMore();
		});
	}
	function addMore(){
		rl.question("Do you want to add another shard? (Yes) ", function(answer) {
			if(answerRegex.yes.test(answer) || answer === ''){
		    	addRs();
		    }
		    else if(answerRegex.no.test(answer)){
		    	completeHandler();
		    }
		    else{
				errorMsg.invalidInput();
				addMore();
		    }
		});
	}
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