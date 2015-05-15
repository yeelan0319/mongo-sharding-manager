var async = require('async'),
	rexec = require('remote-exec'),
	path = require('path'),
	monitorReplicaSet = require('./monitor-replicaset'),
	connection_options = require('../config/cluster-config').connection_options;

exports.run = function(rs, callback) {
	var name = rs.name;
	var members = rs.members;
	async.waterfall([
		//check if the replica set is already initiatated
		function(initRsCallback) {
			monitorReplicaSet.run(rs, initRsCallback);
		},
		//
		function(rsStatus, initRsCallback) {
			//TODO: analysis rsStatus
			//1. All green
			// if(rsStatus.isALreadyInitiated){
			//	console.log("Replica Set " + name + " already started!")
			// 	return callback();
			// }
			async.map(members, function(member, initShardsvrCallback) {
				var initShardsvrScript = [
					'mkdir -p ' + member.dbpath,
					'mkdir -p ' + path.dirname(member.logpath),
					'touch ' + member.logpath,
					'mongod --fork --replSet ' + name + " --logappend --logpath " + member.logpath + " --dbpath " + member.dbpath + " --port " + member.port + " --shardsvr > /dev/null"
				];
				rexec(member.host, initShardsvrScript, connection_options, function(err) {
					if(err) {
						return initShardsvrCallback(err);
					}
					initShardsvrCallback();
				});
			}, function(err) {
				if(err) {
					return initRsCallback(err);
				}
				var configureRsScript = [
					'hostname ' +  members[0].host,
					'mongo --port ' + members[0].port + ' --eval "db.runCommand(rs.initiate())" > /dev/null',
					'mongo --port ' + members[0].port + ' --eval "db.runCommand(rs.add(\'' + members[1].host + ':' + members[1].port + '\'))" > /dev/null',
					'mongo --port ' + members[0].port + ' --eval "db.runCommand(rs.add(\'' + members[2].host + ':' + members[2].port + '\'))" > /dev/null',
				]
				rexec(members[0].host, configureRsScript, connection_options, function(err) {
					if(err) {
						initRsCallback(err);
					}
					console.log("Replica Set " + name + " started successfully!");
					initRsCallback();
				});
			});
		}
	],function(err) {
		if(err) {
			return callback(err);
		}
		callback();
	});
}