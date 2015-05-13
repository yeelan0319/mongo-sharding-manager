var async = require('async'),
	rexec = require('remote-exec'),
	readline = require('readline'),
	path = require('path'),
	_ = require("underscore"),
	message = require('../../lib/message');

module.exports = function(connection_options, rs, configsvrs, callback){
	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

	console.log("\n\n=============Configure Shard=============");
	async.series({
		host: function(configureShardCallback){
			rl.question("Please specify a host for temporary mongos router: ", function(host){
				if(!host){
					return configureShardCallback(message.error.invalidInput);
				}
				configureShardCallback(null, host);
			});
		},
		port: function(configureShardCallback){
			var defaultPort = 27017;
			rl.question("Please specify a port for temporary mongos router(" + defaultPort + "): ", function(port){
				port = port? port : defaultPort;
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
		rl.close();

		if(err){
			return callback(err);
		}

		var configureShardScript = [
			'mkdir -p ' + path.dirname(config.logpath),
			'touch ' + config.logpath,
			'mongos --fork --logappend --logpath ' + config.logpath + ' --port ' + config.port + ' --configdb ' + configsvrs.join(",") + ' > /dev/null'
		];
		_.each(rs, function(shard){
			configureShardScript.push('mongo --port ' + config.port + ' --eval "db.runCommand(sh.addShard(\'' + shard.name + '/' + shard.member + '\'))" > /dev/null');
		});
		configureShardScript.push('mongo --port ' + config.port + ' --eval "sh.status()"');
		rexec(config.host, configureShardScript, connection_options, function(err){
			if(err){
				return callback(err);
			}
			callback(null, configsvrs);
		});
	});
}