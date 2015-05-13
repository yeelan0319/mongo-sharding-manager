module.exports = {
	instruction: {
		systemPrerequsite: "#1. Software Requirement: \n" + 
							"- MongoDB",
		previlegePrerequsite: "#2. Previlege Requirement: \n" +
							"- All server should use the same username & key combination to operate\n" +
							"- All server must have root previlege",
		environmentPrerequsite: "#3. Environment Requirement: \n" +
							"- All running mongod and mongos instance must be stopped\n" +
							"- Existing Data may cause configuration failure" + 
							"- You must not mix localhost together with remote server in configuration, use either one of them"
	},
	error: {
		invalidInput: "Error: Invalid Input",
		terminated: "Error: Program Terminated By User"
	}
}