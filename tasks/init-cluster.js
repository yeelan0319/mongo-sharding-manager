var async = require('async'),
	path = require('path'),
	_ = require("underscore"),
	readline = require('readline'),
	rexec = require('remote-exec'),
	message = require('../lib/message'),
	initReplicaSet = require('./init-replicaset'),
	monitorCluster = require('./monitor-cluster'),
	connection_options = require('../config/cluster-config').connection_options;

exports.run = function(cluster, callback) {
	var replicaSets = cluster.replicaSets;
	var configsvrs = cluster.configsvrs;
	var manager = cluster.manager;
	var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

	async.waterfall([
		function(initClusterCallback) {
			systemPrerequsite();
			rl.question("\nPlease check the above system requirement are met before continue. Press ENTER to continue. ", function() {
				rl.close();
				initClusterCallback();
			});
		},
		//check if the mongo shard is already initiatated
		function(initClusterCallback) {
			monitorCluster.run(cluster, initClusterCallback);
		},
		//initiate replica set
		function(shStatus, initClusterCallback) {
			// if(!shStatus){
			// 	// TODO: analysis
			// 	return completeHandler(callback);
			// }
			console.log("\n\n=============Configure Replica Set=============");
			// TODOS: should be able to change this method to parallel one. Now if you run multiple on single server. It crashes.
			async.mapSeries(replicaSets, function(rs, initReplicaSetCallback) {
				initReplicaSet.run(rs, initReplicaSetCallback);
			}, function(err) {
				if(err){
					return initClusterCallback(err);
				}
				initClusterCallback();
			});
		},
		//init config server
		function(initClusterCallback) {
			console.log("\n\n=============Configure Config Server=============");
			async.map(configsvrs, function(configsvr, initConfigsvrCallback) {
				var initConfigsvrScript = [
					'mkdir -p ' + configsvr.dbpath,
					'mkdir -p ' + path.dirname(configsvr.logpath),
					'touch ' + configsvr.logpath,
					'mongod --fork --logappend --logpath ' + configsvr.logpath + " --dbpath " + configsvr.dbpath + " --port " + configsvr.port + " --configsvr > /dev/null"
				];
				rexec(configsvr.host, initConfigsvrScript, connection_options, function(err) {
					if(err) {
						return initConfigsvrCallback(err);
					}
					console.log("Configure Server " + configsvr.host + ":" + configsvr.port + " started successfully!");
					initConfigsvrCallback();
				});
			}, function(err) {
				if(err) {
					return initClusterCallback(err);
				}
				initClusterCallback();
			});
		},
		//config the cluster through manager
		function(initClusterCallback) {
			console.log("\n\n=============Configure Shard=============");
			var configsvrsArr = _.map(configsvrs, function(configsvr) {
				return configsvr.host + ":" + configsvr.port;
			});
			var configureShardScript = [
				'mkdir -p ' + path.dirname(manager.logpath),
				'touch ' + manager.logpath,
				'mongos --fork --logappend --logpath ' + manager.logpath + ' --port ' + manager.port + ' --configdb ' + configsvrsArr + ' > /dev/null'
			];
			_.each(replicaSets, function(rs) {
				var name = rs.name;
				var primary = rs.members[0].host + ":" + rs.members[0].port;
				configureShardScript.push('mongo --port ' + manager.port + ' --eval "db.runCommand(sh.addShard(\'' + name + '/' + primary + '\'))" > /dev/null');
			});
			configureShardScript.push('mongo --port ' + manager.port + ' --eval "sh.status()"');
			rexec(manager.host, configureShardScript, connection_options, function(err) {
				if(err) {
					return initClusterCallback(err);
				}
				initClusterCallback();
			});
		}
	], function(err) {
		if(err) {
			return errHandler(err);
		}
		completeHandler();
	});

	function systemPrerequsite() {
		console.log("\n\n=============System Prerequisite=============");
		console.log(message.instruction.systemPrerequsite);
		console.log(message.instruction.previlegePrerequsite);
		console.log(message.instruction.environmentPrerequsite);
	}

	function errHandler(err) {
		console.log(err);
	}

	function completeHandler() {
		var configsvrsArr = _.map(cluster.configsvrs, function(configsvr) {
			return configsvr.host + ":" + configsvr.port;
		});
		var res = {
			code: 0,
			msg: "Configuration! You have successfully configure mongo shard. You can now run:\n" +
				"mongos " + ' --configdb ' + configsvrsArr.join(",") + "\n" +
				"to link to your mongo shard. Remember enableSharding on database before sharding collection"
		};
		callback(null, res);
	}
}

exports.name = "Initiate Mongo Shard";