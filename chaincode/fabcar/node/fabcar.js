"use strict";

const shim = require('fabric-shim');
const util = require('util');

function getResult(s) {
	s = ("" + s + "").toString();
	return Buffer.from(s);
}

let Chaincode = class {
  async Init(stub) {
    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
	  const s1 = "Function ";
	  const s2 = ret.fcn;
	  const s3 = " not found";
	  const message_error = s1 + s2 + s3;
      throw new Error("  " + message_error + "  ");
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async getKeysArr(stub, args) {
	  const arrBuffer = await stub.getState("ARR");
	  const arrString = arrBuffer.toString();
	  return getResult(arrString);
  }


  async getKeyValue(stub, args) {
    const key = (args[0] + "").toString();
    const arrBuffer = await stub.getState("ARR");
    let arrString = arrBuffer.toString();
    const arr = JSON.parse(arrString);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === key) {
        const value = await stub.getState(key);
        return getResult(value);
      };
    };
    throw new Error("KEY_IS_NOT_FOUND");
  };


  async initLedger(stub, args) {
	  const arr = [];
	  const arrString = JSON.stringify(arr);
	  await stub.putState('ARR', Buffer.from(arrString));
	  return getResult("CREATE_EMPTY_ARRAY_OF_KEYS_OK");
  }
  
  async addRegularCheck(stub, args) {
	  const key = (args[0] + "").toString();
	  const checkString = (args[1] + "").toString();

	  const arrBuffer = await stub.getState("ARR");
	  let arrString = arrBuffer.toString();
	  const arr = JSON.parse(arrString);

	  for(let i = 0; i < arr.length; i++) {
		  if(arr[i] === key) {
				const valueBuffer = await stub.getState(key);
				let valueString = valueBuffer.toString();
				const addCheck = valueString + ", " + checkString;
				await stub.putState(key, Buffer.from(addCheck));
				return getResult("valueBuffer: " + valueBuffer + " checkString: " + checkString);
		  }
	  }


	  throw new Error("BENEFICIARY_NOT_EXISTS");
	}


	async addBeneficiary(stub, args) {
		const key = (args[0] + "").toString();
		const nameString = (args[1] + "").toString();
		const arrBuffer = await stub.getState("ARR");
		let arrString = arrBuffer.toString();
		const arr = JSON.parse(arrString);
		
		for(let i = 0; i < arr.length; i++) {
			if(arr[i] === key) {
				throw new Error("BENEFICIARY_ALREADY_EXISTS");
			}
		}

		arr.push(key);
		arrString = JSON.stringify(arr);
		
		await stub.putState('ARR', Buffer.from(arrString));
		
		await stub.putState(key, Buffer.from(nameString));

		return getResult("CREATE_NEW_BENEFICIARY_OK");
	
  }
  
};

shim.start(new Chaincode());

