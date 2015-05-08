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
configureRs();

function configureRs(){
	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var rs = [];

	console.log("=============STEP 1: Configure Replica Set=============");
	addRs();

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
		async.series({
			name: function(callback){
				rl.question("Please name the replica set. (rs" + rs.length + "): ", function(answer){
					if(!answer){
						answer = undefined;
					}
					callback(null, answer);
				});
			},
			primary: function(callback){
				rl.question("Please specify the host:port running primary member of the replica set: ", function(answer){
					if(!answer){
						answer = undefined;
					}
					callback(null, answer);
				});
			},
			secondary: function(callback){
				async.timesSeries(2, function(n, next){
					rl.question("Please specify the host:port running secondary member of the replica set: ", function(answer){
						if(!answer){
							answer = undefined;
						}
						next(null, answer);
					});
				}, function(err, secondary) {
				  	if(err){
						console.log(err);
						rl.close();
					}
					callback(null, secondary);
				});
			},
			dbPath: function(callback){
				rl.question("Please specify data storage path. (/data/rs/): ", function(answer){
					if(!answer){
						answer = undefined;
					}
					callback(null, answer);
				});
			},
			logPath: function(callback){
				rl.question("Please specify log path. (/var/log/mongodb.log): ", function(answer){
					if(!answer){
						answer = undefined;
					}
					callback(null, answer);
				});
			}
		}, 
		function(err, config){
			var defaultConfig = {
				name: "rs" + rs.length,
				dbPath: "/data/rs/",
				logPath: "/var/log/mongodb.log"
			}
			config = _.defaults(config, defaultConfig);
			runRs(config, function(err, config){
				var rsConf = {
					name: config.name,
					member: config.primary
				};
				rs.push(rsConf);
				addMore();
			});	
		});
	}
	function addExistingRs(){
		async.series({
			name: function(callback){
				rl.question("Please specify the name of the replica set: ", function(answer){
					callback(null, answer);
				});
			},
			member: function(callback){
				rl.question("Please specify the member of the replica set: ", function(answer){
					callback(null, answer);
				});
			}
		}, 
		function(err, rsConf){
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
		    	rl.close();
		    	console.log(rs);
		    	console.log("Move to next step");
		    }
		    else{
				errorMsg.invalidInput();
				addMore();
		    }
		});
	}
	function runRs(config, callback){
		console.log("Starting replica set " + config.name + "...");
		// ssh options
		var connection_options = {
			port: 22,
			username: "root",
			privateKey: fs.readFileSync('/Users/ymao/.ssh/id_rsa')
		};

		// host info
		var member = [];
		var temp = config.primary.split(":");
		member.push({
			host: temp[0],
			port: temp[1]
		});
		for(var i = 0; i < 2; i++){
			temp = config.secondary[i].split(":");
			member.push({
				host: temp[0],
				port: temp[1]
			});
		};
		var hosts = _.pluck(member, "host");

		// command to run
		async.series([
			function(cb){
				async.timesSeries(3, function(i, next){
					console.log("Start mongod on host " + member[i].host + "...");
					var cmds = [
						'mkdir -p ' + config.dbPath,
						'mkdir -p ' + path.dirname(config.logPath),
						'touch ' + config.logPath,
						'mongod  --fork --replSet ' + config.name + " --logappend --logpath " + config.logPath + " --dbpath " + config.dbPath + " --port " + member[i].port + " --shardsvr"
					];
					rexec(member[i].host, cmds, connection_options, function(err){
						if(err){
							cb(err);
						}
						next();
					});
				}, function(err){
					if(err){
						return cb(err);
					}
					cb(null);
				});
			},
			function(cb){
				var configureRsScript = [
					'mongo --eval "db.runCommand(rs.initiate())"'
				]
				rexec(member[0].host, , connection_options, function(err){
					if(err){
						cb(err);
					}
					cb(null);
				});
			}
		], function(err){
			if(err){
				return console.log(err);
			}
			console.log("Replica Set " + config.name + " started successfully!")
			callback(null, config);
		});
			
	}
}