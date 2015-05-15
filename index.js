var async = require('async'),
	readline = require('readline'),
	_ = require("underscore"),
	message = require('./lib/message'),
	initCluster = require('./tasks/init-cluster'),
	monitorCluster = require('./tasks/monitor-cluster'),
	config = require('./config/cluster-config');

var tasks = [initCluster, monitorCluster];

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
selectTask();

function selectTask(){
	var rl = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
	});
	console.log("\n\nAvailable Tasks (0 to exit): ");
	_.each(tasks, function(task, i){
		console.log("#" + (i+1) + ". " + task.name);
	});
	rl.question("\nPlease specify the task you want to run:", function(index){
		rl.close();
		if(index === "0") return;

		task = tasks[parseInt(index)-1];
		if(task){
			task.run(config.cluster, function(err, res){
				console.log(res.msg);
				console.log("=================================");
				selectTask();
			});
		}
		else{
			console.log(message.error.invalidInput);
		}
	});	
}
	