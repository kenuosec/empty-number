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
const TYPE_35_2 = 3//35出现机主的二次验证
let delay_between_request = [60000, 5000, 5000, 60000]

let curTokenIdx = 0
let tokens = [
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NDc5MTcsImV4cCI6MTYxMjcxMTkxNywibmJmIjoxNjExODQ3OTE3LCJqdGkiOiIwUTZMdnlhYkF2bmRHaGRYIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.j3I7R4BMMw9YyNuelJNtfnsnOk1_BNxjgRxG4DiZUzY",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDA4MzcsImV4cCI6MTYxMjEwNDgzNywibmJmIjoxNjExMjQwODM3LCJqdGkiOiJ1U0N5bDB6SVlkWlFoUDJiIiwic3ViIjoyMjE2MDIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.d7G1X9k7LBrHhrkpfaqRC3si-iv60qsRSNPidWB1K8s",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyMzk3ODIsImV4cCI6MTYxMjEwMzc4MiwibmJmIjoxNjExMjM5NzgyLCJqdGkiOiJmekFJU3V0NXFzMzFXWGpnIiwic3ViIjoyMzM3MDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.O9zBK2RnyhPIqGpq40E2IPjj4VExcyezX5fRCr4kMvU",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDExOTMsImV4cCI6MTYxMjEwNTE5MywibmJmIjoxNjExMjQxMTkzLCJqdGkiOiJXc3IwYk5NblVpenRQRFdGIiwic3ViIjoxOTExNDgsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.6ZnUCVnUNu_x80XU11fC3q1UEwGPhMQ7f7XTSe-0sxs",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDEzNjMsImV4cCI6MTYxMjEwNTM2MywibmJmIjoxNjExMjQxMzYzLCJqdGkiOiJncWl3WFZxUzlvTnpEaGxRIiwic3ViIjoyMzQ1OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.bt9K6KiuaUUhGed8GEOasNLuQwTJGt4gHrHnqmLWiK0",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTEyNDIyNDgsImV4cCI6MTYxMjEwNjI0OCwibmJmIjoxNjExMjQyMjQ4LCJqdGkiOiJwaVV1UWE5MnljRndVNXJoIiwic3ViIjoyMzQ2MDUsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.sAa7f6enEVzlBWq8Ad88iXX1HQKwcPJdXqUnywBJw7E",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NDg5MTksImV4cCI6MTYxMjcxMjkxOSwibmJmIjoxNjExODQ4OTE5LCJqdGkiOiJFS1dJbldQaVhhTjJ6eVM5Iiwic3ViIjoyNDY5OTIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.g23OaAphZUMpE7TvqizYYVXVEFsKSIjY_lkit1T9zqY",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NDkzMTEsImV4cCI6MTYxMjcxMzMxMSwibmJmIjoxNjExODQ5MzExLCJqdGkiOiJjR2RoMFVVSEFTM2ZtWWVKIiwic3ViIjoyNDY5OTQsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.pt4tqUeDAoDVqnep_qWIGD3yzDQxVj23xCIin0m3CSk",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NDk1NjIsImV4cCI6MTYxMjcxMzU2MiwibmJmIjoxNjExODQ5NTYyLCJqdGkiOiJSajNnek1SZE1kTDdPQ0NSIiwic3ViIjoyNDY5OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.ONCv58cDw4OH319pxLCwaju3MLOdLge6x0Nn4dShgxc",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NDk4NTYsImV4cCI6MTYxMjcxMzg1NiwibmJmIjoxNjExODQ5ODU2LCJqdGkiOiJjVTFKWmhhS0ZuWkI2bkpPIiwic3ViIjoyNDY5OTksInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.6Q2otGGvAPMePjQSrRVA2OZxC8G6Y1dFHVx-7vjYcVQ",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NTAwNjgsImV4cCI6MTYxMjcxNDA2OCwibmJmIjoxNjExODUwMDY4LCJqdGkiOiJQd0JhdkRvakt2ODB1a2lnIiwic3ViIjoyNDcwMDAsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.t9HxNxNLU0Bv_ggtYym1j0Z5LJ9_TS2awumR4pyQ-SM",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NTAyNjAsImV4cCI6MTYxMjcxNDI2MCwibmJmIjoxNjExODUwMjYwLCJqdGkiOiJ0ZG5RcDJSSmFhVlpGcUFwIiwic3ViIjoyNDcwMDEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.d3RPesO_ewiDpcJ15G0vKDeDK1hibAC_2OgnKfRIDpE",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NTA5NjMsImV4cCI6MTYxMjcxNDk2MywibmJmIjoxNjExODUwOTYzLCJqdGkiOiJ6bGI0WmVyRzZHN2oyWDJxIiwic3ViIjoyNDcwMDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.H9qAszi1NbemvS3q5HQuLQ2Gt5e0vMOj4mV91H8twUU",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NTExODMsImV4cCI6MTYxMjcxNTE4MywibmJmIjoxNjExODUxMTgzLCJqdGkiOiJiTXdvYUN4RENGVFhuZHFSIiwic3ViIjoyNDcwMDcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.uyMFFNdAoOXzzChNtEa1zIUXptsV2ZSQVvlrsbjbXlQ",
]

class TelChecker {
    constructor (callback) {
		this.alldata = [];
        this.retdata = [];
		this.twice = []
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
                if (typeof body != "string" && body.message == "未登录") {
                    logger.log('authorization==========>'+authorization)
                }
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
        if (reqType == TYPE_35 || reqType == TYPE_35_2) {
            info = await this.check35Async(tel, reqType == TYPE_35_2);

            if (typeof info == "string") {//请求总数太多会返回502页面内容
                info = {tel, message : "Too Many Attempts."}
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

	async deal35RetData (ret, retdata, retrydata) {
        let mobile = ret.tel
        if (ret && ret.step == "UPLOAD_IMAGES" && ret.session_id) {
            retdata.push( { mobile, status: "√" })
        } else if (ret && ret.message == "机主状态异常") {
            this.twice.push(mobile)
            retdata.push( { mobile, status: "未激活" })
        } else if (ret && ret.message == "此号码不支持换卡") {
            retdata.push( { mobile, status: "未激活" })
        } else if (ret && ret.message == "Too Many Attempts.") {
            if (this.retryTimes == 0) 
                retdata.push( { mobile, status: "未激活", retry: true })
            retrydata.push(mobile)
        } else {
            logger.log('======deal35RetData====失败====:' + mobile)
            retdata.push({ mobile, ret, status: "失败" })
        }
    }

	async deal35_2_RetData (ret, retdata, retrydata) {
        let mobile = ret.tel
        if (ret.message == "服务密码不正确") {
            retdata.push( { mobile, status: "√" })
        } else if (ret.step == "VERIFY_ICCID" && ret.session_id) {
            retdata.push( { mobile, status: "未激活" })
        } else if (ret && ret.message == "Too Many Attempts.") {
            retrydata.push(mobile)
        } else {
            console.log('checkSingle-TYPE_35_2-tel:'+ tel+'-message:'+info.message)
        }
    }

	async dealHaiHangRetData (info, retdata, retrydata) {
        let mobile = info.tel
        if (info.data && info.data.RESULT == '05') {
            retdata.push({mobile, status : '√'})
        }else if (info.data && info.data.RESULT == '03') {
            retdata.push({mobile, status : '未激活'})
        }else {
            logger.log('---dealHaiHangRetData----1111----:'+this.retryTimes)
            if (this.retryTimes == 0) 
                retdata.push( { mobile, status: "失败", retry: true })
            retrydata.push(info.tel)
        }
    }

	async dealHeMaRetData (info, retdata, retrydata) {
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
        if (this.retryTimes > 0 || reqType == TYPE_35_2) retdata = []
        let retrydata = []

		for (let i = 0 ;i < dealingData.length ; i ++) {
            let ret = dealingData [i];
            if (reqType == TYPE_35)
                this.deal35RetData(ret, retdata, retrydata)
            else if (reqType == TYPE_HAIHANG)
                this.dealHaiHangRetData(ret, retdata, retrydata)
            else if (reqType == TYPE_HEMA)
                this.dealHeMaRetData(ret, retdata, retrydata)
            else if (reqType == TYPE_35_2)
                this.deal35_2_RetData(ret, retdata, retrydata)
        }

        //将重试的结果合并到全局的结果里
        if ((this.retryTimes > 0 && retdata.length > 0) || reqType == TYPE_35_2){
            this.mergeRetryData(retdata)
        }

        logger.log('======exportData========retrydata.length:' + retrydata.length)
        if (retrydata.length > 0 && this.retryTimes < 3) {
            this.retryTimes ++
            let delay = delay_between_request[reqType]
            await this.delayTime (delay);
            await this.checkBatch(retrydata, reqType)
        } else if (this.twice.length > 0 && reqType == TYPE_35) {
            reqType = TYPE_35_2
            this.retryTimes = 0
            console.log('-------exportData---------this.twice:')
            console.log(this.twice)
            // let delay = delay_between_request[reqType]
            // await this.delayTime (delay);
            await this.checkBatch(this.twice, reqType)
        } else {
            this.callback && this.callback (this.retdata);
        }
	}

	async checkBatch (telNumbArray, reqType) {

        let BATCH_NUM = 200;
        if (reqType == TYPE_35 || reqType == TYPE_35_2) BATCH_NUM = 60*tokens.length;

		let promises = [];

		for (let i = 0 ; i < BATCH_NUM ; i ++) {
			let tel = telNumbArray.pop ();
			if (tel) {
				promises.push (this.checkSingle (tel, reqType));
			}
		}

        let infos = await Promise.all (promises);
        let dealingdata = this.alldata//请求回来待处理
        if (this.retryTimes > 0 || reqType == TYPE_35_2) {
            dealingdata = []
        } 
        dealingdata.push (...infos);
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
        logger.log('mobiles--------------')

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