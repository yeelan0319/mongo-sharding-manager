var async = require('async'),
	readline = require('readline'),
	configureConnectionInfo = require('./tasks/configureConnectionInfo'),
	configureRs = require('./tasks/configureRs'),
	configureConfigsvr = require('./tasks/configureConfigsvr'),
	configureShard = require('./tasks/configureShard'),
	message = require('./lib/message');

var mongoLogo = [];
mongoLogo.push('           |QQ.                                                                            ');
mongoLogo.push('         .QQQQQ#                                                                           ');
mongoLogo.push('        @QQQQQQQQg                                                                         '); 
mongoLogo.push('      ;QQQQQQQQQQQQ                                                                        ');
mongoLogo.push('     {QQQQQQQQQQQQQQ,                        ___    _                          _           ');
mongoLogo.push('    jQQQQQQQQQQQQQQQQ-               o O O  / __|  | |_     __ _      _ _   __| |          ');
mongoLogo.push('   -QQQQQQQQQQQQQQQQQQ              o       \\__ \\  | ` \\   / _` |    | `_| / _` |          ');
mongoLogo.push('   QQQQQQQQQQQQQQQQQQQh            TS__[O]  |___/  |_||_|  \\__,_|   _|_|_  \\__,_|          ');
mongoLogo.push('   QQQQQQQQQQQQQQQQQQQQ           {======|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|         ');
mongoLogo.push('   QQQQQQQQQQQQQQQQQQQQ          ./o--000""`-0-0-""`-0-0-""`-0-0-""`-0-0-""`-0-0-`         ');
mongoLogo.push('   QQQQQQQQQQQQQQQQQQQQ                                                                    ');
mongoLogo.push('   RQQQQQQQQQQQQQQQQQQR          __  __                            __ _                    ');        
mongoLogo.push('    @QQQQQQQQQQQQQQQQQ          |  \\/  |  __ _    _ _     __ _    / _` |   ___      _ _    ');
mongoLogo.push('     RQQQQQQQQQQQQQQQ*          | |\\/| | / _` |  | ` \\   / _` |   \\__, |  / -_)    | `_|   ');
mongoLogo.push('      RQQQQQQQQQQQQR^           |_|__|_| \\__,_|  |_||_|  \\__,_|   |___/   \\___|   _|_|_    ');
mongoLogo.push('       ^RQQQQQQQQQR             _|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|   ');
mongoLogo.push('         \\RQQQQQR               "`-0-0-""`-0-0-""`-0-0-""`-0-0-""`-0-0-""`-0-0-""`-0-0-`   ');
mongoLogo.push('           ^V^*                                                                            ');
mongoLogo.push('            @U                                                                             ');
mongoLogo.push('            B~                                       Version - 0.0.1                       ');

console.log("");
console.log(mongoLogo.join("\n\r"));

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
console.log("\n\nAvailable Tasks: ");
console.log("#1. Initiate Mongo Shard");
rl.question("\nPlease specify the task you want to run:", function(answer){
	rl.close();
	switch(answer){
		case "1":
			console.log("\n\n=============System Prerequisite=============");
			console.log(message.instruction.systemPrerequsite);
			console.log(message.instruction.previlegePrerequsite);
			console.log(message.instruction.environmentPrerequsite);
			async.waterfall([
				configureConnectionInfo,
				configureRs,
				configureConfigsvr,
				configureShard
			], function(err, configsvrs){
				if(err){
					return console.log(err);
				}
				console.log("Configuration! You have successfully configure mongo shard. You can now run: ");
				console.log("");
				console.log("mongos " + ' --configdb ' + configsvrs.join(","));
				console.log("");
				console.log("to link to your mongo shard. Remember enableSharding on database before sharding collection");
			});	
		break;
		default:
			console.log(message.error.invalidInput);
	}
});		