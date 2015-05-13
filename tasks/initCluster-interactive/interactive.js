var async = require('async'),
	readline = require('readline'),
	configureConnectionInfo = require('./configureConnectionInfo'),
	configureRs = require('./configureRs'),
	configureConfigsvr = require('./configureConfigsvr'),
	configureShard = require('./configureShard'),
	message = require('../../lib/message'),
	validator = require('../../lib/validator');

module.exports = function(callback){
	async.waterfall([
		configureConnectionInfo,
		configureRs,
		configureConfigsvr,
		configureShard
	], callback);			
}