var async = require('async'),
	rexec = require('remote-exec'),
	readline = require('readline'),
	path = require('path'),
	message = require('../../lib/message');

module.exports = function(connection_options, rs, callback){
	var configsvrs = [];

	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
   	
	console.log("\n\n=============Configure Config Server=============");
	async.timesSeries(3, function(i, next){
		console.log("\n" + (i+1) + " of 3 configure servers");
		async.series({
			host: function(configureConfigsvrCallback){
				rl.question("Please specify the host of the configure server: ", function(host){
					if(!host){
						return configureConfigsvrCallback(message.error.invalidInput);
					}
					configureConfigsvrCallback(null, host);
				});
			},
			port: function(configureConfigsvrCallback){
				var defaultPort = 27019;
				rl.question("Please specify the port of the configure server(" + defaultPort + "): ", function(port){
					port = port? port : defaultPort;
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
			rexec(config.host, runConfigsvrScript, connection_options, function(err){
				if(err){
					return next(err);
				}
				configsvrs.push(config.host + ":" + config.port);
				next();
			});
		});
	}, function(err) {
		rl.close();

	  	if(err){
			return callback(err);
		}
		console.log("Configuration! You have started configure servers. Your configure server information is as following: ");
    	console.log(configsvrs.join('\n\r'));
		callback(null, connection_options, rs, configsvrs);
	});
}