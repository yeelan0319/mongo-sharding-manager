var Client = require("ssh2").Client,
		conn = new Client(),
		connection_options = require('../config/cluster-config').connection_options;

exports.run = function(rs, callback){
	var replicasetStatusCmd = 'mongo --port ' + rs.members[0].port + ' --eval "rs.status()"'
  conn.on('ready', function() {
		conn.exec(replicasetStatusCmd, function(err, stream) {
	    if (err) {
	    	throw err;
	    }
	    var rsStatus = '', errMsg = '';
	    
	    stream.setEncoding('utf8');
	    stream.on('close', function(code, signal) {
	      conn.end();
	      if(errMsg){
	      	return callback(null, errMsg);
	      }
	      callback(null, rsStatus);
	    }).on('data', function(data) {
	      rsStatus += data;
	    }).stderr.on('data', function(data) {
	      errMsg += data;
	    });
	  });
	}).connect({
	  host: rs.members[0].host,
	  port: 22,
	  username: connection_options.username,
	  privateKey: connection_options.privateKey
	});
}

exports.name = "Monitor Replica Set";