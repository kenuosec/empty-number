const koa2Req = require('koa2-request')
const database = require('../database');

const Router = require('koa-router');
const JSEncrypt = require('node-jsencrypt');
const request = require('request');
const fs = require('fs');


let tokens = [
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NTMxMTIsImV4cCI6MTYxMTcxNzExMiwibmJmIjoxNjEwODUzMTEyLCJqdGkiOiJpb2FUaUlXbWJaODJUTVNvIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c1nQrZb0eaifdcq47dVTlxVbkDayqckBDwbO2CdOVhc",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NDcxOTIsImV4cCI6MTYxMTcxMTE5MiwibmJmIjoxNjEwODQ3MTkyLCJqdGkiOiJRcTFlWVowcTdlNnp3alF6Iiwic3ViIjoyMjc4NjksInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.kIPOFb0DapXViQ-GGiGI123c38mXAWccSwaai8wbDSU",
    // "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDA4MzcsImV4cCI6MTYxMjEwNDgzNywibmJmIjoxNjExMjQwODM3LCJqdGkiOiJ1U0N5bDB6SVlkWlFoUDJiIiwic3ViIjoyMjE2MDIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.d7G1X9k7LBrHhrkpfaqRC3si-iv60qsRSNPidWB1K8s",
    // "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyMzk3ODIsImV4cCI6MTYxMjEwMzc4MiwibmJmIjoxNjExMjM5NzgyLCJqdGkiOiJmekFJU3V0NXFzMzFXWGpnIiwic3ViIjoyMzM3MDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.O9zBK2RnyhPIqGpq40E2IPjj4VExcyezX5fRCr4kMvU",
    // "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDExOTMsImV4cCI6MTYxMjEwNTE5MywibmJmIjoxNjExMjQxMTkzLCJqdGkiOiJXc3IwYk5NblVpenRQRFdGIiwic3ViIjoxOTExNDgsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.6ZnUCVnUNu_x80XU11fC3q1UEwGPhMQ7f7XTSe-0sxs",
    // "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDEzNjMsImV4cCI6MTYxMjEwNTM2MywibmJmIjoxNjExMjQxMzYzLCJqdGkiOiJncWl3WFZxUzlvTnpEaGxRIiwic3ViIjoyMzQ1OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.bt9K6KiuaUUhGed8GEOasNLuQwTJGt4gHrHnqmLWiK0",
    // "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDIyNDgsImV4cCI6MTYxMjEwNjI0OCwibmJmIjoxNjExMjQyMjQ4LCJqdGkiOiJwaVV1UWE5MnljRndVNXJoIiwic3ViIjoyMzQ2MDUsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.sAa7f6enEVzlBWq8Ad88iXX1HQKwcPJdXqUnywBJw7E",
]

class TelChecker {
    constructor (callback) {
		this.alldata = [];
        this.retdata = [];
		this.state = {
			current : 0,
			total : 0,
        }
        this.retryTimes = 0
        this.curTokenIdx = 0
        
        this.callback = callback;
    }

    async checkAsync (telNo) {

		telNo = parseInt (telNo) || 0;
	
		if (!telNo) {
			return Promise.resolve ({})
		}
	
		var body = this.encData (JSON.stringify ({
			MOBILE: telNo + "", 
			industry: "0"
		}));

		var url = 'https://weixin.10044.cn/wechat/service/api/gatewayH5/IdentifyService/validate';

		return new Promise ((resolve,reject) => {

			request.post (url,{
				headers : {
					'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat' + telNo,
					'content-type': 'application/json;charset=UTF-8',
				},
				body : body,
			},(error, response, body) => {
		
				if (!error) {
					try {
						var info = JSON.parse (body);
						return resolve (info);
					} catch (e) {
						return resolve ({});
					}
				} else {
					return resolve ({});
				}
			})
		})
	}

    async checkAsync2 (telNo) {
		telNo = parseInt (telNo) || 0;
	
		if (!telNo) {
			return Promise.resolve ({})
		}
        var url = joinParams(`https://swszxcx.35sz.net/api/v1/card-replacement/query`, { mobile:telNo });
        let authorization = tokens[this.curTokenIdx]
        this.curTokenIdx = (this.curTokenIdx++)%tokens.length

		return new Promise ((resolve,reject) => {

			request.post (url,{
				headers : {
                    "Authorization": authorization,
                    'content-type': 'application/json',
                },
                body : {},
                json: true,
			},(error, response, body) => {
                console.log(body)
				if (!error) {
					try {
						return resolve (body);
					} catch (e) {
						return resolve ({});
					}
				} else {
                    console.log(error)
					return resolve ({});
				}
			})
		})
	}
	
	async checkSingle (tel, is35) {
        let info 
        if (is35){
            info = await this.checkAsync2 (tel);
        } else
            info = await this.checkAsync (tel);
		let current = this.state.current ;
		current ++;
		this.setState ({current : current});
		info.tel = tel;
		return Promise.resolve (info)
	}
    
    encData (t) {
		var e = new JSEncrypt ();
		e.setPublicKey("-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvPcyDxC9rfwvDxbuurZcYLaHPqMeQYZa6zhpKJDVQcftzHzCCL6u3creyHp+ZlByTxKZCpNSIpPf4XQoDxfgw62CGkVYrxxFqfCdxWDjnmY2Kio8txvsmmddgZeWomylRvaCSx2dTPdL+BzX+sbU5F6jNklmIV5H6o94X0hvTgVqPRvOUxX/+feaEvgcjqyqL5rX3ZrJfYllxiu5bqKZ6uWvAvcEMnJmQHcyHWN8kc8tP+IM6SEMrlu6Sl82xtvY9HNKjltVe6WnDPROwwKOYfzsq5iNB6J2XXT2w9Ykn9BjPxzgF+KqGqbbejLKwZ3EYz5Km5ftQbCEFNKGrxvZkwIDAQAB-----END PUBLIC KEY-----");
		t = encodeURIComponent(t);
		for (var n = t.replace(/[\u0391-\uFFE5]/g, "aa").length, i = 0, r = 118, o = new Array; i <= n; ) {
			o.push(e.encrypt(t.substring(i, r)));
			i = r;
			r += 117;
		}
		return o.join(",");
	}

	async delayTime (ms) {
		return new Promise ((resolve,reject) => {
			setTimeout(() => {
				resolve ();
			}, ms);
		})
	}

	async exportToFile () {
        let alldata = this.alldata || [];
        let retdata = []
        let retrydata = []

		for (let i = 0 ;i < alldata.length ; i ++) {
			let info = alldata [i];
			let status = {mobiles:info.tel};

            if (info.data && info.data.RESULT == '05') {
				status.status = '√'
                retdata.push(status)
            }else if (info.data && info.data.RESULT == '03') {
                status.status = '未激活'
                 retdata.push(status)
            }else{
                retrydata.push(info.tel)
            }
        }
        if (retrydata.length > 0 && this.retryTimes < 3){
            this.retryTimes ++
		    await this.delayTime (5000);
            await this.checkBatch(retrydata)
        }else{
            this.callback && this.callback (retdata);
        }
    }
    
	async mergeRetryData (retrydata) {
        let mobilesMap = {}
        for(let i in retrydata){
            mobilesMap[retrydata[i].mobile] = i;//if (retrydata[i].retry != true) 
        }
        let length = this.retdata.length
        for(let i = 0; i<length; i++) {
            let index = mobilesMap[this.retdata[i].mobile]
            if (index) {
                this.retdata[i] = retrydata[index]
            }
        }
    }

	async exportToFile2 (dealingData) {
        let retdata = this.retdata
        if (this.retryTimes > 0) retdata = []
        let retrydata = []

		for (let i = 0 ;i < dealingData.length ; i ++) {
			let ret = dealingData [i];
            let mobile = ret.tel
            if (ret && ret.step == "UPLOAD_IMAGES" && ret.session_id) {
                console.log('======exportToFile2====√====:' + mobile)
                retdata.push( { mobile, status: "√" })
            } else if (ret && ret.message == "机主状态异常") {
                console.log('======exportToFile2====未激活====:' + mobile)
                retdata.push( { mobile, status: "未激活" })
            } else if (ret && ret.message == "此号码不支持换卡") {
                console.log('======exportToFile2====未激活==1==:' + mobile)
                retdata.push( { mobile, status: "未激活" })
            } else if (ret && ret.message == "Too Many Attempts.") {
                if (this.retryTimes == 0) 
                    retdata.push( { mobile, status: "失败", retry: true })
                retrydata.push(mobile)
                console.log('======record========retrydata.length:' + retrydata.length)
            } else {
                console.log('======exportToFile2====失败====:' + mobile)
                retdata.push( { mobile, ret, status: "失败" })
            }
        }

        //将重试的结果合并到全局的结果里
        if (this.retryTimes > 0 && retdata.length > 0){
            this.mergeRetryData(retdata)
        }

        if (retrydata.length > 0 && this.retryTimes < 3) {
            console.log('======retry========retrydata.length:' + retrydata.length + ' ===retryTimes:' + this.retryTimes)
            this.retryTimes ++
            console.log('---delayTime-----before-----'+new Date().valueOf())
            console.log(retrydata)
            await this.delayTime (40000);
            console.log('---delayTime-----after-----'+new Date().valueOf())
            await this.checkBatch(retrydata, true)
        } else {
            this.callback && this.callback (this.retdata);
        }
	}

	async checkBatch (telNumbArray, is35) {

        let BATCH_NUM = 60*tokens.length;
        if (!is35) BATCH_NUM = 200

		let promises = [];

		for (let i = 0 ; i < BATCH_NUM ; i ++) {
			let tel = telNumbArray.pop ();
			if (tel) {
				promises.push (this.checkSingle (tel, is35));
			}
		}

        let infos = await Promise.all (promises);
        let dealingdata = this.alldata//请求回来待处理
        if (this.retryTimes > 0){
            dealingdata = []
        } 
        dealingdata.push (...infos);

		let tellen = telNumbArray.length;
		if (tellen <= 0) {
            if (is35) 
                this.exportToFile2 (dealingdata);
            else
                this.exportToFile (dealingdata);
			return ;
        }
        
        console.log('-checkBatch--delayTime-----before-----'+new Date().valueOf())
        if (is35) await this.delayTime (60000);
		else await this.delayTime (5000);
        console.log('-checkBatch--delayTime-----after-----'+new Date().valueOf())

		await this.checkBatch (telNumbArray, is35);
	}

	setState (state) {

	}

	checkFile (filePath) {
		fs.readFile (filePath,'utf8',(err,data) => {
			if (err) {
				console.error (err);
				return ;
			}
		
			data = data.trim ();

			let telNumbArray = data.split ("\r\n");

			this.setState ({
				showProgress : true,
				total : telNumbArray.length,
				current : 0,
			});

			this.checkBatch (telNumbArray);
		})
	}
}

let joinParams = function (path, params) {
    var url = path;
    if (Object.keys(params).length > 0) {
        url = url + "?";
        for (var key in params) {
            url = url + key + "=" + params[key] + "&";
        }
        var length = url.length;
        if (url[length - 1] == '&') {
            url = url.substring(0, length - 1);
        }
    }
    return url;
}

const httpRequest = async (path, params, postData, authorization) => {
    var url = joinParams(path, params);
    var options = {
        method: 'POST',
        url: url,
        json: true,
        body: postData,
        headers: {
            "Authorization": authorization,
            'content-type': 'application/json',
        }
    }

    const res = await koa2Req(options)
    return res.body
}
        
function encData(t) {
    var e = new JSEncrypt();
    e.setPublicKey("-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvPcyDxC9rfwvDxbuurZcYLaHPqMeQYZa6zhpKJDVQcftzHzCCL6u3creyHp+ZlByTxKZCpNSIpPf4XQoDxfgw62CGkVYrxxFqfCdxWDjnmY2Kio8txvsmmddgZeWomylRvaCSx2dTPdL+BzX+sbU5F6jNklmIV5H6o94X0hvTgVqPRvOUxX/+feaEvgcjqyqL5rX3ZrJfYllxiu5bqKZ6uWvAvcEMnJmQHcyHWN8kc8tP+IM6SEMrlu6Sl82xtvY9HNKjltVe6WnDPROwwKOYfzsq5iNB6J2XXT2w9Ykn9BjPxzgF+KqGqbbejLKwZ3EYz5Km5ftQbCEFNKGrxvZkwIDAQAB-----END PUBLIC KEY-----");
    t = encodeURIComponent(t);
    for (var n = t.replace(/[\u0391-\uFFE5]/g, "aa").length, i = 0, r = 118, o = new Array; i <= n;) {
        o.push(e.encrypt(t.substring(i, r)));
        i = r;
        r += 117;
    }
    return o.join(",");
}

const hanghaiRequest = async (mobile) => {
    var url = 'https://weixin.10044.cn/wechat/service/api/gatewayH5/IdentifyService/validate';
    var body = encData(JSON.stringify({
        MOBILE: mobile + "",
        industry: "0"
    }));
    var options = {
        method: 'POST',
        url: url,
        json: true,
        body: body,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat' + mobile,
            'content-type': 'application/json;charset=UTF-8',
        }
    }

    const res = await koa2Req(options)
    return res.body
}

async function post(mobile, token) {
    let url = `https://swszxcx.35sz.net/api/v1/card-replacement/query`
    let params = { mobile }
    let ret = await httpRequest(url, params, {}, token)
    console.log(ret)
    if (ret && ret.step == "UPLOAD_IMAGES" && ret.session_id) {
        return mobile + "   √"
    } else if (ret && ret.message == "机主状态异常") {
        return mobile + "   未激活"
    } else if (ret && ret.message == "此号码不支持换卡") {
        return mobile + "   未激活"
    } else if (ret && ret.message == "Too Many Attempts.") {
        await delay(1000)
        return { mobile, retry: true }
    } else {
        return { mobile, ret, token }
    }
}

async function post1(mobile, token) {
    let url = `https://swszxcx.35sz.net/api/v1/card-replacement/query`
    let params = { mobile }
    let ret = await httpRequest(url, params, {}, token)
    console.log(ret)
    if (ret && ret.step == "UPLOAD_IMAGES" && ret.session_id) {
        return { mobile, status: "√" }
    } else if (ret && ret.message == "机主状态异常") {
        return { mobile, status: "未激活" }
    } else if (ret && ret.message == "此号码不支持换卡") {
        return { mobile, status: "未激活" }
    } else if (ret && ret.message == "Too Many Attempts.") {
        await delay(1000)
        return { mobile, retry: true }
    } else {
        return { mobile, ret, token, status: "失败" }
    }
}

async function postAll(mobiles, mode) {
    const tCount = tokens.length
    const interval = tCount * 50

    let data = []
    let retrys = []
    for (let i in mobiles) {
        let mobile = mobiles[i]
        if (i % interval == 0 && i > 0) await delay(5000)

        const token = tokens[i % tCount]
        let ret
        if (mode == 1)
            ret = await post1(mobile, token)
        else
            ret = await post(mobile, token)

        if (typeof ret == "string") {
            console.log('--------00-------' + i)
            data[i] = ret
        } else if (ret.retry) {
            retrys[retrys.length] = { mobile, index: i }
            data[i] = "retry"
            console.log('--------retrys.length:' + retrys.length)
        } else {
            console.log('--------11-------' + i)
            data[i] = ret
        }
    }

    let i = 0
    console.log('--------retrys begin-------length:' + retrys.length)
    while (i < retrys.length) {
        if (i % interval == 0) await delay(5000)
        let index = retrys[i].index
        let mobile = retrys[i].mobile
        const token = tokens[i % tCount]
        let ret
        if (mode == 1)
            ret = await post1(mobile, token)
        else
            ret = await post(mobile, token)

        if (typeof ret == "string") {
            data[index] = ret
            console.log('--------0-------' + index)
        } else if (ret.retry) {
            retrys[retrys.length] = { mobile, index }
            console.log('--------retrys.length-------' + retrys.length)
        } else {
            console.log('--------1-------' + index)
            data[index] = ret
        }
        i++;
        console.log('--------retrys.length-------i:' + i + "====retrys.length:" + retrys.length)
    }
    return data
}

async function postHanghai(mobile) {
    let info = await hanghaiRequest(mobile)
    if (info.data && info.data.RESULT == '05') {
        return { mobile, status: "√" }
    }else if (info.data && info.data.RESULT == '03') {
        return { mobile, status: "未激活" }
    // } else if (info && info.message == "Too Many Attempts.") {
    //     await delay(1000)
    //     return { mobile, retry: true }
    } else {
        return { mobile, info, status: "失败" }
    }
}

async function getAllHHData (mobiles) {
    return new Promise ((resolve,reject) => {
        let chker = new TelChecker ((data) => {
            resolve (data);
        })
        chker.checkBatch(mobiles, false)
    })

}

async function getAll35HData (mobiles) {
    return new Promise ((resolve,reject) => {
        let chker = new TelChecker ((data) => {
            resolve (data);
        })
        chker.checkBatch(mobiles, true)
    })

}

async function postAllHanghai(mobiles, mode) {
    let data = []
    let retrys = []
    for (let i in mobiles) {
        let mobile = mobiles[i]
        // if (i % 200 == 0 && i > 0) await delay(5000)

        let ret = await postHanghai(mobile)

        if (ret.retry) {
            retrys[retrys.length] = { mobile, index: i }
            data[i] = "retry"
            console.log('--------retrys.length-------' + retrys.length)
        } else if (ret.info) {
            console.log('--------00----error---' + i)
            console.log(ret.info)
            data[i] = ret
        } else {
            console.log('--------11-------' + i)
            data[i] = ret
        }
    }

    let i = 0
    console.log('--------retrys.length-------' + retrys.length)
    while (i < retrys.length) {
        if (i % interval == 0) await delay(5000)
        let index = retrys[i].index
        let mobile = retrys[i].mobile
        const token = tokens[i % tCount]
        let ret = await postHanghai(mobile)

        if (typeof ret == "string") {
            data[index] = ret
            console.log('--------0-------' + index)
        } else if (ret.retry) {
            retrys[retrys.length] = { mobile, index }
            console.log('--------retrys.length-------' + retrys.length)
        } else {
            console.log('--------1-------' + index)
            data[index] = ret
        }
        i++;
        console.log('--------retrys.length-------i:' + i + "====retrys.length:" + retrys.length)
    }
    return data
}

function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    })
}

async function delay(time) {
    return await sleep(time)
}

//子路由
let tests = new Router();
tests
    .get('/', async (ctx) => {
        let mobiles = (ctx.query.mobiles || '').split(',');//get
        // let data = await postAll(mobiles)
        let data = await getAll35HData(mobiles, 1)

        ctx.body = {
            data,
            ret: 0
        };
    })
    .post('/', async (ctx) => {
        let mobiles = ctx.request.body.mobiles || '';//post
        console.log(mobiles)
        // let data = await postAll(mobiles, 1)
        let data = await getAll35HData(mobiles, 1)

        ctx.body = {
            data,
            ret: 0
        };
    })
    .post('/api', async (ctx) => {
        console.log(ctx.request.body)
        let md5 = ctx.request.body.md5 || '';
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0');

        let set = await database.findAndCheckExpire({code, ptype})
        console.log(set)

        if (set.length > 0) {
            ctx.body = {
                tokens,
                ret: 0
            };
        } else {
            ctx.body = {
                ret: 1,
                msg: "激活码或不存在或已过期",
            };
        }
    })

    .post('/hanghai', async (ctx) => {
        let mobiles = ctx.request.body.mobiles || '';//post
        // let mobiles = (ctx.query.mobiles || '').split(',');//get
        console.log(mobiles)

        // let data = await postAllHanghai(mobiles)
        let data = await getAllHHData(mobiles)
        ctx.body = {
            data,
            ret: 0
        };
    })

    
module.exports = tests