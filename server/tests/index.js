const koa2Req = require('koa2-request')
const database = require('../database');

const Router = require('koa-router');
const JSEncrypt = require('node-jsencrypt');
const request = require('request');
const fs = require('fs');

// let options = {
//   flags: 'a',     // append模式
//   encoding: 'utf8',  // utf8编码
// };
 
// let stdout = fs.createWriteStream('./stdout.log', options);
// let stderr = fs.createWriteStream('./stderr.log', options);
 
// 创建logger
let logger = console//new console.Console(options);
 
const TYPE_35 = 0
const TYPE_HAIHANG = 1
const TYPE_HEMA = 2
let delay_between_request = [60000, 5000, 5000]

let curTokenIdx = 0
let tokens = [
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NTMxMTIsImV4cCI6MTYxMTcxNzExMiwibmJmIjoxNjEwODUzMTEyLCJqdGkiOiJpb2FUaUlXbWJaODJUTVNvIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c1nQrZb0eaifdcq47dVTlxVbkDayqckBDwbO2CdOVhc",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NDcxOTIsImV4cCI6MTYxMTcxMTE5MiwibmJmIjoxNjEwODQ3MTkyLCJqdGkiOiJRcTFlWVowcTdlNnp3alF6Iiwic3ViIjoyMjc4NjksInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.kIPOFb0DapXViQ-GGiGI123c38mXAWccSwaai8wbDSU",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDA4MzcsImV4cCI6MTYxMjEwNDgzNywibmJmIjoxNjExMjQwODM3LCJqdGkiOiJ1U0N5bDB6SVlkWlFoUDJiIiwic3ViIjoyMjE2MDIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.d7G1X9k7LBrHhrkpfaqRC3si-iv60qsRSNPidWB1K8s",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyMzk3ODIsImV4cCI6MTYxMjEwMzc4MiwibmJmIjoxNjExMjM5NzgyLCJqdGkiOiJmekFJU3V0NXFzMzFXWGpnIiwic3ViIjoyMzM3MDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.O9zBK2RnyhPIqGpq40E2IPjj4VExcyezX5fRCr4kMvU",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDExOTMsImV4cCI6MTYxMjEwNTE5MywibmJmIjoxNjExMjQxMTkzLCJqdGkiOiJXc3IwYk5NblVpenRQRFdGIiwic3ViIjoxOTExNDgsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.6ZnUCVnUNu_x80XU11fC3q1UEwGPhMQ7f7XTSe-0sxs",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDEzNjMsImV4cCI6MTYxMjEwNTM2MywibmJmIjoxNjExMjQxMzYzLCJqdGkiOiJncWl3WFZxUzlvTnpEaGxRIiwic3ViIjoyMzQ1OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.bt9K6KiuaUUhGed8GEOasNLuQwTJGt4gHrHnqmLWiK0",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDIyNDgsImV4cCI6MTYxMjEwNjI0OCwibmJmIjoxNjExMjQyMjQ4LCJqdGkiOiJwaVV1UWE5MnljRndVNXJoIiwic3ViIjoyMzQ2MDUsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.sAa7f6enEVzlBWq8Ad88iXX1HQKwcPJdXqUnywBJw7E",
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
        
        this.callback = callback;
    }

    async checkHaiHangAsync (telNo) {

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

    async check35Async (telNo, isCheck) {
		telNo = parseInt (telNo) || 0;
	
		if (!telNo) {
			return Promise.resolve ({})
		}
        var url
        if (isCheck) {
            url = joinParams(`https://swszxcx.35sz.net/api/v1/transfer/query`, { mobile:telNo, password:"123456"});
        } else {
            url = joinParams(`https://swszxcx.35sz.net/api/v1/card-replacement/query`, { mobile:telNo});
        }
        let authorization = tokens[curTokenIdx]
        curTokenIdx++
        curTokenIdx = curTokenIdx%tokens.length

		return new Promise ((resolve, reject) => {

			request.post (url, {
				headers : {
                    "Authorization": authorization,
                    'content-type': 'application/json',
                },
                body : {},
                json: true,
			},(error, response, body) => {
                logger.log(body)
				if (!error) {
					try {
						return resolve (body);
					} catch (e) {
						return resolve ({});
					}
				} else {
                    logger.log(error)
					return resolve ({});
				}
			})
		})
	}
	
    async checkHeMaAsync (telNo) {
		telNo = parseInt (telNo) || 0;
	
		if (!telNo) {
			return Promise.resolve ({})
		}
        var url = joinParams(`http://wx.hippocom.com.cn/wxtomcat/businesshandling/validatePhoneNoRecharge.do`, { phoneNum:telNo });
		return new Promise ((resolve,reject) => {
			request.get (url, (error, response, body) => {
                // logger.log(body)
				if (!error) {
					try {
						return resolve ({ret:body});
					} catch (e) {
						return resolve ({});
					}
				} else {
                    logger.log(error)
					return resolve ({});
				}
			})
		})
	}
	
	async checkSingle (tel, reqType) {
        let info 
        if (reqType == TYPE_35) {
            info = await this.check35Async(tel, false);

            if (typeof info == "string") {//请求总数太多会返回502页面内容
                info = {tel, message : "Too Many Attempts."}
            } else if (info.message == "机主状态异常") {
                let info1 = await this.check35Async(tel, true);
                if (info1.message == "服务密码不正确") {
                    info.session_id = '1'
                    info.step = 'UPLOAD_IMAGES'
                } else if (info1.step == "VERIFY_ICCID" && info1.session_id) {
                    // info.message = ''//还是‘机主状态异常’
                } else {
                    console.log('checkSingle-TYPE_35-tel:'+ tel+'-message:'+info.message)
                }
            }
        } else if (reqType == TYPE_HAIHANG) {
            info = await this.checkHaiHangAsync (tel);
        } else if (reqType == TYPE_HEMA) {
            info = await this.checkHeMaAsync (tel);
        }
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

	async exportHaiHang (dealingData) {
        let retdata = this.retdata || [];

        if (this.retryTimes > 0) {
            retdata = []
        }
        let retrydata = []

		for (let i = 0 ;i < dealingData.length ; i ++) {
			let info = dealingData [i];

            if (info.data && info.data.RESULT == '05') {
                retdata.push({mobile:info.tel, status : '√'})
            }else if (info.data && info.data.RESULT == '03') {
                retdata.push({mobile:info.tel, status : '未激活'})
            }else {
                logger.log('---exportHaiHang----1111----:'+this.retryTimes)
                if (this.retryTimes == 0) 
                    retdata.push( { mobile, status: "失败", retry: true })
                retrydata.push(info.tel)
            }
        }

        //将重试的结果合并到全局的结果里
        if (this.retryTimes > 0 && retdata.length > 0){
            this.mergeRetryData(retdata)
        }
        if (retrydata.length > 0 && this.retryTimes < 3){
            this.retryTimes ++
            let delay = delay_between_request[TYPE_HAIHANG]
		    await this.delayTime (delay);
            await this.checkBatch(retrydata, TYPE_HAIHANG)
        }else{
            this.callback && this.callback (this.retdata);
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

	async export35 (dealingData) {
        let retdata = this.retdata
        if (this.retryTimes > 0) retdata = []
        let retrydata = []

		for (let i = 0 ;i < dealingData.length ; i ++) {
			let ret = dealingData [i];
            let mobile = ret.tel
            if (ret && ret.step == "UPLOAD_IMAGES" && ret.session_id) {
                retdata.push( { mobile, status: "√" })
            } else if (ret && ret.message == "机主状态异常") {
                retdata.push( { mobile, status: "未激活" })
            } else if (ret && ret.message == "此号码不支持换卡") {
                retdata.push( { mobile, status: "未激活" })
            } else if (ret && ret.message == "Too Many Attempts.") {
                if (this.retryTimes == 0) 
                    retdata.push( { mobile, status: "失败", retry: true })
                retrydata.push(mobile)
                logger.log('======record========retrydata.length:' + retrydata.length)
            } else {
                logger.log('======export35====失败====:' + mobile)
                retdata.push( { mobile, ret, status: "失败" })
            }
        }

        //将重试的结果合并到全局的结果里
        if (this.retryTimes > 0 && retdata.length > 0){
            this.mergeRetryData(retdata)
        }

        if (retrydata.length > 0 && this.retryTimes < 3) {
            this.retryTimes ++
            let delay = delay_between_request[TYPE_35]
            await this.delayTime (delay);
            await this.checkBatch(retrydata, TYPE_35)
        } else {
            this.callback && this.callback (this.retdata);
        }
	}

	async deal35RetData (ret, retdata, retrydata) {
        let mobile = ret.tel
        if (ret && ret.step == "UPLOAD_IMAGES" && ret.session_id) {
            retdata.push( { mobile, status: "√" })
        } else if (ret && ret.message == "机主状态异常") {
            retdata.push( { mobile, status: "未激活" })
        } else if (ret && ret.message == "此号码不支持换卡") {
            retdata.push( { mobile, status: "未激活" })
        } else if (ret && ret.message == "Too Many Attempts.") {
            if (this.retryTimes == 0) 
                retdata.push( { mobile, status: "失败", retry: true })
            retrydata.push(mobile)
            logger.log('======record========retrydata.length:' + retrydata.length)
        } else {
            logger.log('======deal35RetData====失败====:' + mobile)
            retdata.push({ mobile, ret, status: "失败" })
        }
    }

	async dealHaiHangRetData (info, retdata, retrydata) {
        let mobile = info.tel
        if (info.data && info.data.RESULT == '05') {
            retdata.push({mobile, status : '√'})
        }else if (info.data && info.data.RESULT == '03') {
            retdata.push({mobile, status : '未激活'})
        }else {
            logger.log('---exportHaiHang----1111----:'+this.retryTimes)
            if (this.retryTimes == 0) 
                retdata.push( { mobile, status: "失败", retry: true })
            retrydata.push(info.tel)
        }
    }

	async dealHeMaRetData (info, retdata, retrydata) {
        logger.log(info)
        let mobile = info.tel

        if (info.ret == '1' || info.ret == '') {
            retdata.push({mobile:info.tel, status : '√'})
        } else  if (info.ret == '4') {
            retdata.push({mobile:info.tel, status : '未激活'})
        } else  if (info.ret == '2') {
            retdata.push({mobile:info.tel, status : '非河马号码'})
        } else {
            retdata.push({mobile:info.tel, status : info.ret})
        }
    }

	async exportData (dealingData, reqType) {
        let retdata = this.retdata
        if (this.retryTimes > 0) retdata = []
        let retrydata = []

		for (let i = 0 ;i < dealingData.length ; i ++) {
            let ret = dealingData [i];
            if (reqType == TYPE_35)
                this.deal35RetData(ret, retdata, retrydata)
            else if (reqType == TYPE_HAIHANG)
                this.dealHaiHangRetData(ret, retdata, retrydata)
            else if (reqType == TYPE_HEMA)
                this.dealHeMaRetData(ret, retdata, retrydata)
        }

        //将重试的结果合并到全局的结果里
        if (this.retryTimes > 0 && retdata.length > 0){
            this.mergeRetryData(retdata)
        }

        if (retrydata.length > 0 && this.retryTimes < 3) {
            this.retryTimes ++
            let delay = delay_between_request[reqType]
            await this.delayTime (delay);
            await this.checkBatch(retrydata, reqType)
        } else {
            this.callback && this.callback (this.retdata);
        }
	}

	async checkBatch (telNumbArray, reqType) {

        let BATCH_NUM = 200;
        if (reqType == TYPE_35) BATCH_NUM = 60*tokens.length;

		let promises = [];

		for (let i = 0 ; i < BATCH_NUM ; i ++) {
			let tel = telNumbArray.pop ();
			if (tel) {
				promises.push (this.checkSingle (tel, reqType));
			}
		}

        let infos = await Promise.all (promises);
        let dealingdata = this.alldata//请求回来待处理
        if (this.retryTimes > 0) {
            dealingdata = []
        } 
        dealingdata.push (...infos);
        console.log('====================dealingdata=')
        console.log(infos)
		let tellen = telNumbArray.length;
		if (tellen <= 0) {
            this.exportData (dealingdata, reqType);
			return ;
        }
        
        let delay = delay_between_request[reqType]
        if (delay) await this.delayTime (delay);

		await this.checkBatch (telNumbArray, reqType);
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
    logger.log(ret)
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
    logger.log(ret)
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
            logger.log('--------00-------' + i)
            data[i] = ret
        } else if (ret.retry) {
            retrys[retrys.length] = { mobile, index: i }
            data[i] = "retry"
            logger.log('--------retrys.length:' + retrys.length)
        } else {
            logger.log('--------11-------' + i)
            data[i] = ret
        }
    }

    let i = 0
    logger.log('--------retrys begin-------length:' + retrys.length)
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
            logger.log('--------0-------' + index)
        } else if (ret.retry) {
            retrys[retrys.length] = { mobile, index }
            logger.log('--------retrys.length-------' + retrys.length)
        } else {
            logger.log('--------1-------' + index)
            data[index] = ret
        }
        i++;
        logger.log('--------retrys.length-------i:' + i + "====retrys.length:" + retrys.length)
    }
    return data
}

async function postHanghai(mobile) {
    let info = await hanghaiRequest(mobile)
    if (info.data && info.data.RESULT == '05') {
        return { mobile, status: "√" }
    }else if (info.data && info.data.RESULT == '03') {
        return { mobile, status: "未激活" }
    } else {
        return { mobile, info, status: "失败" }
    }
}

async function getAllHHData (mobiles) {
    return new Promise ((resolve,reject) => {
        let chker = new TelChecker ((data) => {
            resolve (data);
        })
        chker.checkBatch(mobiles, TYPE_HAIHANG)
    })

}

async function getAll35HData (mobiles) {
    return new Promise ((resolve,reject) => {
        let chker = new TelChecker ((data) => {
            resolve (data);
        })
        chker.checkBatch(mobiles, TYPE_35)
    })

}

async function getAllHeMaData (mobiles) {
    return new Promise ((resolve,reject) => {
        let chker = new TelChecker ((data) => {
            resolve (data);
        })
        chker.checkBatch(mobiles, TYPE_HEMA)
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
            logger.log('--------retrys.length-------' + retrys.length)
        } else if (ret.info) {
            logger.log('--------00----error---' + i)
            logger.log(ret.info)
            data[i] = ret
        } else {
            logger.log('--------11-------' + i)
            data[i] = ret
        }
    }

    let i = 0
    logger.log('--------retrys.length-------' + retrys.length)
    while (i < retrys.length) {
        if (i % interval == 0) await delay(5000)
        let index = retrys[i].index
        let mobile = retrys[i].mobile
        const token = tokens[i % tCount]
        let ret = await postHanghai(mobile)

        if (typeof ret == "string") {
            data[index] = ret
            logger.log('--------0-------' + index)
        } else if (ret.retry) {
            retrys[retrys.length] = { mobile, index }
            logger.log('--------retrys.length-------' + retrys.length)
        } else {
            logger.log('--------1-------' + index)
            data[index] = ret
        }
        i++;
        logger.log('--------retrys.length-------i:' + i + "====retrys.length:" + retrys.length)
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
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0');
        let mobiles = ctx.request.body.mobiles || '';//post
        logger.log(mobiles)

        let set = await database.findAndCheckExpire({code, ptype})
        if (! (set && set._id)) {
            ctx.body = {
                msg: "激活码已过期",
                ret: 2
            };
            return 
        } else {
            // let data = await postAll(mobiles, 1)
            let data = []
            let mobilesMap = {}
            for (let i in mobiles) {
                mobilesMap[mobiles[i]] = i
                data[i] = true
            }
            let resData = await getAll35HData(mobiles, 1)
            for (let dt of resData) {
                let index = mobilesMap[dt.mobile]
                data[index] = dt
            }

            ctx.body = {
                data,
                ret: 0
            };
        }
    })
    .post('/api', async (ctx) => {
        logger.log(ctx.request.body)
        let md5 = ctx.request.body.md5 || '';
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0');

        let set = await database.findAndCheckExpire({code, ptype})
        logger.log(set)

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
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0');
        let mobiles = ctx.request.body.mobiles || '';//post
        // let mobiles = (ctx.query.mobiles || '').split(',');//get
        logger.log(mobiles)

        let set = await database.findAndCheckExpire({code, ptype})
        if (!(set && set._id)) {
            ctx.body = {
                msg: "激活码已过期",
                ret: 2
            };
            return 
        } else {
            // let data = await postAllHanghai(mobiles)
            let data = []
            let mobilesMap = {}
            for (let i in mobiles) {
                mobilesMap[mobiles[i]] = i
                data[i] = true
            }
            let resData = await getAllHHData(mobiles)
            for (let dt of resData) {
                let index = mobilesMap[dt.mobile]
                data[index] = dt
            }

            ctx.body = {
                data,
                ret: 0
            };
        }
    })

    .post('/hema', async (ctx) => {
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0');
        let mobiles = ctx.request.body.mobiles || '';//post
        logger.log(mobiles)

        // let set = await database.findAndCheckExpire({code, ptype})
        // if (!(set && set._id)) {
        //     ctx.body = {
        //         msg: "激活码已过期",
        //         ret: 2
        //     };
        //     return 
        // } else {
            let data = []
            let mobilesMap = {}
            for (let i in mobiles) {
                mobilesMap[mobiles[i]] = i
                data[i] = true
            }
            let resData = await getAllHeMaData(mobiles)
            for (let dt of resData) {
                let index = mobilesMap[dt.mobile]
                data[index] = dt
            }

            ctx.body = {
                data,
                ret: 0
            };
        // }
    })

    
module.exports = tests