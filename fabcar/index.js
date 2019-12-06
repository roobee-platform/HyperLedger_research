"use strict";

const execSync = require('child_process').execSync;
const express = require("express");
const app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    next();
});

function writeLine() {
	console.log("--------------------------------------");
}

const port = 5005;
app.listen(port);
console.log("Server works on port: " + port);
writeLine();
console.log("  ");

app.get('/*', (request, response) => {
	writeLine();
	console.log("Method: GET");
	console.log("Url: " + request.url);
	
	if(request.url === "/") {
		response.sendfile("./page.html");
		return;
	}
	
	const dictionary = request.query;
	
	console.log("Operation: " + dictionary["operation"]);
	
	if(dictionary["operation"] === "getBeneficiary") {
		const beneficiaryString = useCmd("node query.js getAllbeneficiary");
		response.end(beneficiaryString);
		return;
	}
	
	if(dictionary["operation"] === "getAllRegularChecks") {
		const cheksString = useCmd("node query.js getAllRegularChecks");
		response.end(cheksString);
		return;
	}
	
	if(dictionary["operation"] === "addBeneficiary") {
		const id = dictionary["id"].toString();
		const name = dictionary["name"].toString();
		let result = useCmd("node invoke.js addBeneficiary " + id + " " + name);
		if(result.length === 0) {
			result = "ERROR";
		}
		response.end(result);
		return;
	}
	
	if(dictionary["operation"] === "addRegularCheck") {
		const id = dictionary["id"].toString();
		const date = dictionary["date"].toString();
		const location = dictionary["location"].toString();
		const staff = dictionary["staff"].toString();
		const diagnosis = dictionary["diagnosis"].toString();

		let result = useCmd("node invoke.js addRegularCheck " + id + " " + visit);
		if(result.length === 0) {
			result = "ERROR";
		}
		response.end(result);
		return;
	}
	
	response.end("BAD_OPERATION");
});

function useCmd(s) {
	const options = {
		encoding: 'utf8'
	};
	const cmd = s.toString();
	const answer = execSync(cmd, options);
	return answer.toString();
}
