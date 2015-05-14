var async = require('async'),
	rexec = require('remote-exec'),
	readline = require('readline'),
	path = require('path'),
	message = require('../lib/message'),
	validator = require('../lib/validator');

module.exports = function(connection_options, callback){
	var rs = [];
    var addMore = false;

	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
   	
    console.log("\n\n=============Configure Replica Set=============");
    async.doWhilst(function(configureRsCallback){
    	async.waterfall([
    		queryIfRsExist,
    		function(ifExist, configureProcedureCallback){
    			if(ifExist){
    				addExistingRs(configureProcedureCallback)
    			}
    			else{
    				createRs(configureProcedureCallback);
    			}
    		}
    	], function(err, rsConf){
    		if(err){
    			return configureRsCallback(err);
    		}
    		rs.push(rsConf);
    		queryIfAddMore(configureRsCallback);
    	})
    }, 
    // run test against addMore variable to see if the user want to add more replica set
    function(){
    	return addMore;
    }, 
    // callback when configure rs terminate by user/error
    function(err){
    	rl.close();

    	if(err){
    		return callback(err);
    	}
    	
    	console.log("Configuration! You have complete shard configuration. Your shard configuration is as following: ");
    	console.log(rs);
    	callback(null, connection_options, rs);
    });

	function queryIfRsExist(configureProcedureCallback){
		rl.question("Do you already have the replica set running? (Yes) ", function(answer) {
			if(validator.yes.test(answer) || answer === ''){
		    	configureProcedureCallback(null, true);
		    }
		    else if(validator.no.test(answer)){
		    	configureProcedureCallback(null, false);
		    }
		    else{
				console.log(message.error.invalidInput);
				queryIfRsExist(configureProcedureCallback);
		    }
		});
	}
	function createRs(configureProcedureCallback){
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
						createRsCallback(message.error.invalidInput);
					}
					primary = primary.split(":");
					config.members = [{
						host: primary[0],
						port: primary[1]
					}];
					createRsCallback(null, config);
				});
			},
			function(config, createRsCallback){
				async.timesSeries(2, function(i, next){
					console.log((i+1) + " of 2 secondary members");
					rl.question("Please specify the host:port running as secondary member of the replica set: ", function(secondary){
						if(!secondary){
							next(message.error.invalidInput);
						}
						secondary = secondary.split(":");
						config.members.push({
							host: secondary[0],
							port: secondary[1]
						})
						next();
					});
				}, function(err, secondary) {
				  	if(err){
						createRsCallback(err);
					}
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
			},
			function(config, createRsCallback){
				console.log("");
				console.log("Starting replica set " + config.name + "...");
				async.timesSeries(config.members.length, function(i, next){
					console.log("Start mongod on host " + config.members[i].host + "...");
					var prepareRsScript = [
						'mkdir -p ' + config.dbpath,
						'mkdir -p ' + path.dirname(config.logpath),
						'touch ' + config.logpath,
						'mongod --fork --replSet ' + config.name + " --logappend --logpath " + config.logpath + " --dbpath " + config.dbpath + " --port " + config.members[i].port + " --shardsvr > /dev/null"
					];
					rexec(config.members[i].host, prepareRsScript, connection_options, function(err){
						if(err){
							return next(err);
						}
						next();
					});
				}, function(err){
					if(err){
						return createRsCallback(err);
					}
					createRsCallback(null, config);
				});
			},
			function(config, createRsCallback){
				var configureRsScript = [
					'hostname ' +  config.members[0].host,
					'mongo --port ' + config.members[0].port + ' --eval "db.runCommand(rs.initiate())" > /dev/null',
					'mongo --port ' + config.members[0].port + ' --eval "db.runCommand(rs.add(\'' + config.members[1].host + ':' + config.members[1].port + '\'))" > /dev/null',
					'mongo --port ' + config.members[0].port + ' --eval "db.runCommand(rs.add(\'' + config.members[2].host + ':' + config.members[2].port + '\'))" > /dev/null',
                    'mongo --port ' + config.members[0].port + ' --eval "printjson(rs.status())"'
				]
				rexec(config.members[0].host, configureRsScript, connection_options, function(err){
					if(err){
						createRsCallback(err);
					}
					console.log("Replica Set " + config.name + " started successfully!")
					createRsCallback(null, config);
				});
			}
		], 
		function(err, config){
			if(err){
				return configureProcedureCallback(err);
			}
			var rsConf = {
				name: config.name,
				member: config.members[0].host + ":" + config.members[0].port
			};
			configureProcedureCallback(null, rsConf);
		});
	}

	function addExistingRs(configureProcedureCallback){
		async.series({
			name: function(addExistingRsCallback){
				rl.question("Please specify the name of the replica set: ", function(name){
					addExistingRsCallback(null, name);
				});
			},
			member: function(addExistingRsCallback){
				rl.question("Please specify the member(host:port) of the replica set: ", function(member){
					addExistingRsCallback(null, member);
				});
			}
		}, 
		function(err, rsConf){
			if(err){
				return configureProcedureCallback(err);
			}
			configureProcedureCallback(null, rsConf);
		});
	}
	function queryIfAddMore(configureRsCallback){
		rl.question("\nDo you want to add another shard? (Yes) ", function(answer) {
			if(validator.yes.test(answer) || answer === ''){
		    	addMore = true;
		    	configureRsCallback();
		    }
		    else if(validator.no.test(answer)){
		    	addMore = false;
		    	configureRsCallback();
		    }
		    else{
				console.log(message.error.invalidInput);
				queryIfAddMore(configureRsCallback);
		    }
		});
	}
}