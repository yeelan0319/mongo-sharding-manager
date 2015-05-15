var Client = require('ssh2').Client,
	connection_options = require('../config/cluster-config').connection_options;

exports.run = function(cluster, callback) {
	var conn = new Client();
	var shardStatusCmd = 'mongo --port ' + cluster.manager.port + ' --eval "sh.status()"';
	
	conn.on('ready', function() {
  	conn.exec(shardStatusCmd, function(err, stream) {
	    if (err) {
	    	throw err;
	    } 
	    var clusterStatus = '',
	    		errMsg = '';

	    stream.setEncoding("utf8");
	    stream.on('close', function(code, signal) {
	      conn.end();
	      var res = {
	      	code: code,
	      	signal: signal,
	      	msg: errMsg? errMsg : clusterStatus
	      }
	      callback(null, res);
	    })
	    .on('data', function(data) {
	      clusterStatus += data;
	    })
	    .stderr.on('data', function(data) {
	      errMsg += data;
	    });
  	});
	}).connect({
  	host: cluster.manager.host,
  	port: 22,
  	username: connection_options.username,
  	privateKey: connection_options.privateKey
	});
}

exports.name = "Monitor Mongo Shard";