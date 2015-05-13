var fs = require('fs'),
	async = require('async'),
	readline = require('readline');

module.exports = function(callback){
	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

	console.log("\n\n=============Configure SSH Connection Info=============");
	async.series({
		username: function(connectionConfigCallback){
			var defaultUsername = "root";
			rl.question("Please specify the username that have root previlege(" + defaultUsername + "): ", function(username){
				connectionConfigCallback(null, username? username : defaultUsername);
			});
		},
		privateKey: function(connectionConfigCallback){
			var defaultPrivateKeyPath = process.env['HOME'] + '/.ssh/id_rsa';
			rl.question("Please specify the private key you use to login(" + defaultPrivateKeyPath + "): ", function(privateKeyPath){
				connectionConfigCallback(null, fs.readFileSync(privateKeyPath? privateKeyPath : defaultPrivateKeyPath));
			});
		}
	}, 
	function(err, connection_options){
		rl.close();

		if(err){
			return callback(err);
		}

		console.log("Configuration! You have complete connection configuration.");
		connection_options.port = 22;
		callback(null, connection_options);
	});
}