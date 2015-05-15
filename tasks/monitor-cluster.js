var Client = require('ssh2').Client,
	conn = new Client(),
	config = require("../config/cluster-config");

exports.run = function(){
	conn.on('ready', function() {
	    var shardStatusCmd = 'mongo --port ' + config.cluster.manager.port + ' --eval "sh.status()"';

	  	conn.exec(shardStatusCmd, function(err, stream) {
		    if (err) throw err;
		    stream.setEncoding("utf8");
		    stream.on('close', function(code, signal) {
		      	conn.end();
		    }).on('data', function(data) {
		      	console.log(data);
		    }).stderr.on('data', function(data) {
		      	console.log('STDERR: ' + data);
		    });
	  	});
	}).connect({
	  	host: config.cluster.manager.host,
	  	port: 22,
	  	username: config.connection_options.username,
	  	privateKey: config.connection_options.privateKey
	});
}

exports.name = "Monitor Mongo Shard";