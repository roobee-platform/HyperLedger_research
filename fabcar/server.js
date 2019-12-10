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

function MakeInvoke(operation, argumentsArray, callback) {
    ////////////////////////////////////////////////////////////////
    const write = {};
    write.log = function(s) {};
    write.info = function(s) {};
    write.error = function(s) {};

    let OPERATION = operation;
    let ARR = argumentsArray;
    ////////////////////////////////////////////////////////////////


    var Fabric_Client = require('fabric-client');
    var path = require('path');
    var util = require('util');
    var os = require('os');

    //
    var fabric_client = new Fabric_Client();

    // setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer = fabric_client.newPeer('grpc://localhost:7051');
    channel.addPeer(peer);
    var order = fabric_client.newOrderer('grpc://localhost:7050')
    channel.addOrderer(order);

    //
    var member_user = null;
    var store_path = path.join(__dirname, 'hfc-key-store');
    write.log('Store path:'+store_path);
    var tx_id = null;

    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        // assign the store to the fabric client
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        // use the same location for the state store (where the users' certificate are kept)
        // and the crypto store (where the users' keys are kept)
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);

        // get the enrolled user from persistence, this user will sign all requests
        return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            write.log('Successfully loaded user1 from persistence');
            member_user = user_from_store;
        } else {
            callback("ERROR");
        }

        // get a transaction id object based on the current user assigned to fabric client
        tx_id = fabric_client.newTransactionID();
        write.log("Assigning transaction_id: ", tx_id._transaction_id);

        // createCar chaincode function - requires 5 args, ex: args: ['CAR12', 'Honda', 'Accord', 'Black', 'Tom'],
        // changeCarOwner chaincode function - requires 2 args , ex: args: ['CAR10', 'Dave'],
        // must send the proposal to endorsing peers
        var request = {
            //targets: let default to the peer assigned to the client
            chaincodeId: 'fabcar',
            fcn: OPERATION,
            args: ARR,
            chainId: 'mychannel',
            txId: tx_id
        };

        // send the transaction proposal to the peers
        return channel.sendTransactionProposal(request);
    }).then((results) => {
        var proposalResponses = results[0];
        var proposal = results[1];
        let isProposalGood = false;
        if (proposalResponses && proposalResponses[0].response &&
            proposalResponses[0].response.status === 200) {
                isProposalGood = true;
                write.log('Transaction proposal was good');
                console.log("AAAAAA: " + proposalResponses[0].response.payload + "");
                callback(proposalResponses[0].response.payload + "");
            } else {
                callback("ERROR");
            }
        if (isProposalGood) {
            write.log(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                proposalResponses[0].response.status, proposalResponses[0].response.message));

            // build up the request for the orderer to have the transaction committed
            var request = {
                proposalResponses: proposalResponses,
                proposal: proposal
            };

            // set the transaction listener and set a timeout of 30 sec
            // if the transaction did not get committed within the timeout period,
            // report a TIMEOUT status
            var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
            var promises = [];

            var sendPromise = channel.sendTransaction(request);
            promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

            // get an eventhub once the fabric client has a user assigned. The user
            // is required bacause the event registration must be signed
            let event_hub = channel.newChannelEventHub(peer);

            // using resolve the promise so that result status may be processed
            // under the then clause rather than having the catch clause process
            // the status
            let txPromise = new Promise((resolve, reject) => {
                let handle = setTimeout(() => {
                    event_hub.unregisterTxEvent(transaction_id_string);
                    event_hub.disconnect();
                    resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
                }, 3000);
                event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                    // this is the callback for transaction event status
                    // first some clean up of event listener
                    clearTimeout(handle);

                    // now let the application know what happened
                    var return_status = {event_status : code, tx_id : transaction_id_string};
                    if (code !== 'VALID') {
                        write.error('The transaction was invalid, code = ' + code);
                        resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                    } else {
                        write.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
                        resolve(return_status);
                    }
                }, (err) => {
                    //this is the callback if something goes wrong with the event registration or processing
                    //reject(new Error('There was a problem with the eventhub ::'+err));
                    callback("ERROR");
                },
                    {disconnect: true} //disconnect when complete
                );
                event_hub.connect();

            });
            promises.push(txPromise);

            return Promise.all(promises);
        } else {
            //write.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
            callback("ERROR");
            //throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
        }
    }).then((results) => {
        write.log('Send transaction promise and event listener promise have completed');
        // check the results in the order the promises were added to the promise all list
        if (results && results[0] && results[0].status === 'SUCCESS') {
            write.log('Successfully sent transaction to the orderer.');
            //callback(results);
        } else {
            //write.error('Failed to order the transaction. Error code: ' + results[0].status);
            callback("ERROR");
        }

        if(results && results[1] && results[1].event_status === 'VALID') {
            write.log('Successfully committed the change to the ledger by the peer');
        } else {
            //write.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
            callback("ERROR");
        }
    }).catch((err) => {
        //write.error('Failed to invoke successfully :: ' + err);
        callback("ERROR");
    });
}


app.get('/*', (request, response) => {
	writeLine();
	console.log("Method: GET");
    console.log("Url: " + request.url);
	if(request.url === "/") {
		response.sendfile("./aaa.html");
		return;
	}
	
	const dictionary = request.query;
	
	console.log("Operation: " + dictionary["operation"]);
	
	if(dictionary["operation"] === "getBeneficiary") {
		const beneficiaryString = useCmd("node query.js getKeysArr");
		response.end(beneficiaryString);
		return;
	}
	
	if(dictionary["operation"] === "getKeyValue") {
        const id = dictionary["id"].toString();
		const cheksString = useCmd("node query.js getKeyValue " + id);
		response.end(cheksString);
		return;
	}
	
	if(dictionary["operation"] === "addBeneficiary") {
		const id = dictionary["id"].toString();
        const name = dictionary["name"].toString();
        
        const bodyObj = {key : id, 
            fio : {"name" : name}
        }
        console.log("  " + JSON.stringify(bodyObj));
        MakeInvoke("addBeneficiary", [bodyObj.key, JSON.stringify(bodyObj.fio)], function(answer) {
            if(answer === "ERROR")  {
                response.end("Ошибка добавления бенефициара");
            } 
            else {
                response.end("Добавление успешно");
            }
        })
        
    }
	if(dictionary["operation"] === "addRegularCheck") {
		const id = dictionary["id"].toString();
		const date = dictionary["date"].toString();
		const location = dictionary["location"].toString();
		const staff = dictionary["staff"].toString();
		const diagnosis = dictionary["diagnosis"].toString();
        const bodyObj = {key : id, 
            fio : {"date" : date , "location" : location , "staff" : staff , "diagnosis" : diagnosis , }
        }
        console.log("key " + bodyObj.key + " fio " + JSON.stringify(bodyObj.fio));
        MakeInvoke("addRegularCheck", [bodyObj.key, JSON.stringify(bodyObj.fio)], function(answer) {
            if(answer === "ERROR")  {
                response.end("Ошибка добавления осмотра");
            } 
            else {
                response.end("Добавление успешно");
            }
        })
        
    }
});
function useCmd(s) {
	const options = {
		encoding: 'utf8'
	};
	const cmd = s.toString();
	const answer = execSync(cmd, options);
	return answer.toString();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
}
