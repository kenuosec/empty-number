// ======================================================================
// ======================================================================

const request = require('request');
const fs = require('fs');
const xlsx = require('node-xlsx');

class TCheckerItem {
	constructor (option) {
		option = option || {};
		this.token = option.token;
	}

	async checkSingle (tel) {
		let info = await this.checkAsync (tel);
		info.tel = tel;
		console.log (info);
		return Promise.resolve (info)
	}

	async checkAsync (telNo) {

		telNo = parseInt (telNo) || 0;
		let token = this.token;
	
		if (!telNo) {
			return Promise.resolve ({})
		}

		let url = 'https://swszxcx.35sz.net/api/v1/card-replacement/query?mobile=' + telNo;

		return new Promise ((resolve,reject) => {

			request.post (url,{
				headers : {
					'Authorization' : token,
					'content-type': 'application/json',
				},
				// body : body,
				json : true,
			},(error, response, body) => {
		
				// console.log (body);
				if (!error) {
					try {
						return resolve (body);
					} catch (e) {
						return resolve ({});
					}
				} else {
					return resolve ({});
				}
			})
		})
	}

	getToken () {
		return this.token;
	}

}

class TokenItem {
	constructor (option) {
		option 			= option || {};
		this.timeout 	= option.timeout || 60;
		this.token 		= option.token; 
	}

	runTick () {
		this.timeout --;
		// console.log (this.token.substring (0,10),this.timeout);
		return this.timeout;
	}

	getToken () {
		return this.token;
	}
}

class HLTelChecker {
	constructor (options) {
		options 		= options || {};
		this.tokenPool 	= options.tokens || [];
		
		this.cdPool 	= [];
		this.datas 		= [];
		this.output	 	= [];

		this.cdTime 	= 61;	
		this.batchNr 	= 60;
        
        this.callback   = null;
        this.timer 		= null;
        
		this.checkTimer ();
	}

	onItemTick () {
		for (let i = 0 ; i < this.cdPool.length ; i ++) {
			let item = this.cdPool [i];
			if (item.runTick () <= 0) {

				// cool down succeed . put to totalPool 
				let token = item.getToken ();
				console.log (`Cool down ${token} succeed,put it to totalPool`);

				this.tokenPool.push (token);
				this.cdPool.splice (i,1);
				break;
			}
		}
	}

	checkTimer () {
		
		clearTimeout (this.timer);
		this.onItemTick ();

		this.timer = setTimeout (() => {	
			this.checkTimer ();
		},1000)
	}

	async delayTime (ms) {
		return new Promise ((resolve,reject) => {
			setTimeout(() => {
				resolve ();
			}, ms);
		})
	}

	async checkBatchAsync () {

		let promises 	= [];
		let BATCH_NUM 	= this.batchNr;
		let CD_TIME 	= this.cdTime;

		let token 	= this.tokenPool.pop ();

		if (!token) {
			console.log ("no token used ,waiting for cd");
			await this.delayTime (1000);
			this.checkBatchAsync ();
			return ;
		}

		let item = new TCheckerItem ({token : token});

		for (let i = 0 ; i < BATCH_NUM ; i ++) {
			let telNo = this.datas.pop ();
			if (!telNo) {
				break;
			}
			promises.push (item.checkSingle (telNo));
		}

		// run all tasks 
		let rets = await Promise.all (promises) || [];

		// token 
		console.log (`put ${token} to cdPool`); 
		let tokenItem = new TokenItem ({timeout : CD_TIME,token : token})
		this.cdPool.push (tokenItem);
		
		// rets 
		for (let i = 0 ; i < rets.length ; i ++) {
			let retinfo = rets [i] || {};
			if (retinfo && retinfo.message && retinfo.message.indexOf ('Too Many Attempts') >= 0) {
				this.datas.push (retinfo.tel);
			} else {
				this.output.push (retinfo);
			}
		}

		if (this.datas.length > 0) {
			console.log (`remain ${this.datas.length} items`);
			this.checkBatchAsync ();
		} else {
            console.log ("All data ends =====>");
            clearTimeout (this.timer);
            this.timer = null;

            this.callback && this.callback (this.output);
		}
	}

	resetAll () {
		this.cdPool 	= [];
		this.datas 		= [];
		this.output 	= [];
	}

	async run (telNum,callback) {

        this.callback = callback;

		this.resetAll ();
		this.datas = telNum || [];

		this.checkBatchAsync ();
	}
}



// let chk = new HHTelChecker ();
// chk.checkFile ("./hh1000.txt")

// let chk = new HMTelChecker ();
// chk.checkFile ("./hm1400.txt");

let chk = new HLTelChecker({
	tokens: [
		"BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NTMxMTIsImV4cCI6MTYxMTcxNzExMiwibmJmIjoxNjEwODUzMTEyLCJqdGkiOiJpb2FUaUlXbWJaODJUTVNvIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c1nQrZb0eaifdcq47dVTlxVbkDayqckBDwbO2CdOVhc",
		"BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NDcxOTIsImV4cCI6MTYxMTcxMTE5MiwibmJmIjoxNjEwODQ3MTkyLCJqdGkiOiJRcTFlWVowcTdlNnp3alF6Iiwic3ViIjoyMjc4NjksInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.kIPOFb0DapXViQ-GGiGI123c38mXAWccSwaai8wbDSU",
		"BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDA4MzcsImV4cCI6MTYxMjEwNDgzNywibmJmIjoxNjExMjQwODM3LCJqdGkiOiJ1U0N5bDB6SVlkWlFoUDJiIiwic3ViIjoyMjE2MDIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.d7G1X9k7LBrHhrkpfaqRC3si-iv60qsRSNPidWB1K8s",
		"BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyMzk3ODIsImV4cCI6MTYxMjEwMzc4MiwibmJmIjoxNjExMjM5NzgyLCJqdGkiOiJmekFJU3V0NXFzMzFXWGpnIiwic3ViIjoyMzM3MDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.O9zBK2RnyhPIqGpq40E2IPjj4VExcyezX5fRCr4kMvU",
		"BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDExOTMsImV4cCI6MTYxMjEwNTE5MywibmJmIjoxNjExMjQxMTkzLCJqdGkiOiJXc3IwYk5NblVpenRQRFdGIiwic3ViIjoxOTExNDgsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.6ZnUCVnUNu_x80XU11fC3q1UEwGPhMQ7f7XTSe-0sxs",
		"BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDEzNjMsImV4cCI6MTYxMjEwNTM2MywibmJmIjoxNjExMjQxMzYzLCJqdGkiOiJncWl3WFZxUzlvTnpEaGxRIiwic3ViIjoyMzQ1OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.bt9K6KiuaUUhGed8GEOasNLuQwTJGt4gHrHnqmLWiK0",
		"BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDIyNDgsImV4cCI6MTYxMjEwNjI0OCwibmJmIjoxNjExMjQyMjQ4LCJqdGkiOiJwaVV1UWE5MnljRndVNXJoIiwic3ViIjoyMzQ2MDUsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.sAa7f6enEVzlBWq8Ad88iXX1HQKwcPJdXqUnywBJw7E",
	]
});

let telNum = [];
for (let i = 0 ; i < 1500 ; i ++) {
	telNum.push (13824394179);
}

chk.run (telNum,(data) => {
    console.log (data);
    console.log ("All data ends =====>");

    let str = JSON.stringify (data);
    fs.writeFile ("hhoutput.txt",str,() => {
        
    })
});