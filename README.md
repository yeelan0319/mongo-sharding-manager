# mongo-sharding-manager
Initiate and manage mongo sharding from one centralized terminal via SSH
<br>

## System Requirement
###Software Requirement
1. MongoDB

###Previlege Requirement
1. All server should use the same username & key combination to operate
2. All server must have root previlege

###Environment Requirement
1. All running mongod and mongos instance must be stopped

###Warning:
1. Existing Data may cause configuration failure
2. You must not mix localhost together with remote server in configuration, use either one of them
  
##Task
###Initiate Mongo Shard
This task will help you initiate a mongo shard from scratch through the following steps:
- Configure replica set as shard for cluster storage
- Configure configure servers serve cluster's metadata
- Add shards to cluster through a temporary mongos instance

In this task, you must exactly obey the mongoDB official documentation for production environment using replica set as shard and configure exactly 3 configure server for failure tolerance.
For the replica set, you can either use a currently running one, or you can create replica set on the fly through shard manager.

![Production Cluster Architecture](http://docs.mongodb.org/manual/_images/sharded-cluster-production-architecture.png)

The above structure is the cluster service distribution, which requires at least 10 servers/VMs in total.

1. 3 servers for each replica set * 2 replica sets
2. 3 configure servers
3. 1 application server running mongos

However, if you are just intend to run a test, we can cleverly structure the service distribution using 3 servers in total.

1. Running as rs0/primary, rs1/secondary, configsvr fallback
2. Running as rs0/secondary, rs1/primary, configsvr fallback
3. Running as rs0/secondary, rs1/secondary, configsvr primary

Then have either your local machine/above machine running application and link to cluster as mongos.

(Following task are still under construction, lol)
###Sharding Collection for exsting cluster
###Check cluster running status(status/performance)
###Adding new shard to cluster
###Restart member in cluster

Add-on Features
Check input validity
Add container support(docker)
Loose the production requirement, so user can use single mongod instance and one configure server to build a dev environment
