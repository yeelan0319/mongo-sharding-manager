var fs = require("fs");

exports.connection_options = {
	username: "root",
	privateKey: fs.readFileSync(process.env['HOME'] + '/.ssh/id_rsa')
};

exports.cluster = {
	manager:{
		host: "52.24.174.7",
		port: "27017",
		logpath: "/var/log/mongos.log"
	},
	replicaSets:[{
		name: "rs0",
		members: [{
			host: "52.24.134.192",
			port: "27017",
			dbpath: "/data/rs0",
			logpath: "/var/log/mongodb_rs0.log"
		},
		{
			host: "52.24.131.132",
			port: "27017",
			dbpath: "/data/rs0",
			logpath: "/var/log/mongodb_rs0.log"
		},
		{
			host: "52.24.156.136",
			port: "27017",
			dbpath: "/data/rs0",
			logpath: "/var/log/mongodb_rs0.log"
		}]
	},
	{
		name: "rs1",
		members: [{
			host: "52.24.131.132",
			port: "27018",
			dbpath: "/data/rs1",
			logpath: "/var/log/mongodb_rs1.log"
		},
		{
			host: "52.24.156.136",
			port: "27018",
			dbpath: "/data/rs1",
			logpath: "/var/log/mongodb_rs1.log"
		},
		{
			host: "52.24.134.192",
			port: "27018",
			dbpath: "/data/rs1",
			logpath: "/var/log/mongodb_rs1.log"
		}]
	}],
	configsvrs:[{
			host: "52.24.156.136",
			port: "27019",
			dbpath: "/data/configdb",
			logpath: "/var/log/mongodb_config.log"
		},
		{
			host: "52.24.134.192",
			port: "27019",
			dbpath: "/data/configdb",
			logpath: "/var/log/mongodb_config.log"
		},
		{
			host: "52.24.131.132",
			port: "27019",
			dbpath: "/data/configdb",
			logpath: "/var/log/mongodb_config.log"
	}]	
}