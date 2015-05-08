var fs = require('fs'),
	async = require('async'),
	rexec = require('remote-exec'),
	readline = require('readline');

var mongoLogo = [];
mongoLogo.push("||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||");
mongoLogo.push("|||R""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""5|||");
mongoLogo.push("|||L                                                                        ||||");
mongoLogo.push("|||L                                                                        ||||");
mongoLogo.push("|||L                                   ,S                                   ||||");
mongoLogo.push("|||L                                  S||Q,                                 ||||");
mongoLogo.push("|||L                                {S|||SSQ                                ||||");
mongoLogo.push("|||L                              ;Q|||||SSSQQ                              ||||");
mongoLogo.push("|||L                             SSS|||||SSSSSQy                            ||||");
mongoLogo.push("|||L                            SSSS|||||SSSSSSSQ                           ||||");
mongoLogo.push("|||L                          ,SSSSSS||||SSSSSSSSQ                          ||||");
mongoLogo.push("|||L                          QSSSSSSS|||SSSSSSSSSQ                         ||||");
mongoLogo.push("|||L                         @SSSSSSSSS||SSSSSSSSSSQ                        ||||");
mongoLogo.push("|||L                         SSSSSSSSSS|SSSSSSSSSSSS                        ||||");
mongoLogo.push("|||L                        ]SSSSSSSSSSSSSSSSSSSSSSSU                       ||||");
mongoLogo.push("|||L                        ]SSSSSSSSSSSSSSSSSSSSSSSQ                       ||||");
mongoLogo.push("|||L                        5SSSSSSSSSSSSSQSQQQQSSSSS                       ||||");
mongoLogo.push("|||L                        5SSSSSSSSSSSSSSSSSQQQQQQS                       ||||");
mongoLogo.push("|||L                        ]SSSSSSSSSSSSSQQQQQQQQQQU                       ||||");
mongoLogo.push("|||L                         BSSSSSSSSSSSSQQQQQQQQQQ                        ||||");
mongoLogo.push("|||L                          SSSSSSSSSSSSQQQQSQQQQU                        ||||");
mongoLogo.push("|||L                           SSSSSSSSSSSQQQQQQQQU                         ||||");
mongoLogo.push("|||L                            SSSSSSSSSQQQQQQQSH                          ||||");
mongoLogo.push("|||L                             'SSSSSSSQQQQQQS`                           ||||");
mongoLogo.push("|||L                               HSSSSUSQQQS^                             ||||");
mongoLogo.push("|||L                                 HSSh5QSL                               ||||");
mongoLogo.push("|||L                                   F  '                                 ||||");
mongoLogo.push("|||L                                                                        ||||");
mongoLogo.push("|||L                                                                        ||||");
mongoLogo.push("|||L                                                                        ||||");
mongoLogo.push("|||Q,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,||||");
mongoLogo.push("||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||");

console.log(mongoLogo.join("\n\r"));
console.log("");
console.log("");
console.log("Version - 0.0.1");
console.log("");

function configureReplicaSet(){
	var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("=============STEP 1: Configure Replica Set=============");
	rl.question("Do you already have replica set running? (Yes) ", function(b) {
	    rl.close();
	    var i = parseInt(b);
	    if(isNaN(i))
	    {
	        if(typeof self.buildHash[b] !== 'undefined')
	        {
	            self.builds = [self.buildHash[b]];
	        }
	        else
	        {
	            self.fail("Invalid build target.");
	        }
	    }
	    else
	    {
	        if(typeof self.builds[i] !== 'undefined')
	        {
	            self.builds = [self.builds[i]];
	        }
	        else
	        {
	            self.fail("Invalid build target.");
	        }
	    }
	    self.go();
	});
}

	
var connection_options = {
	port: 22,
	username: "ubuntu",
	privateKey: fs.readFileSync('/Users/ymao/.ssh/id_rsa')
};

var hosts = [
	"52.24.134.192",  //server 1
	"52.24.131.132",  //server 2
	"52.24.156.136"   //server 3
];

var cmds = [
	'ls -l',
	'cat /etc/hosts'
];

rexec(hosts, cmds, connection_options, function(err){
	if(err){
		console.log(err);
	}
	else{
		console.log("Greate success!!")
	}
});