const koa2Req = require('koa2-request')
const database = require('../database');

const Router = require('koa-router');
const JSEncrypt = require('node-jsencrypt');
const request = require('request');
const fs = require('fs');
const iconv = require('iconv-lite');

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
const TYPE_BEIWEI = 4
let delay_between_request = [60000, 5000, 5000, 60000]

let curTokenIdx = 0
let tokens = [
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NTc1MzcsImV4cCI6MTYxMzYyMTUzNywibmJmIjoxNjEyNzU3NTM3LCJqdGkiOiI3aGVEUk15TkJvb0RrM3Y2Iiwic3ViIjoyNDY5OTIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.o4wj6m3bb6XuWsXRrPnLa4ByBbyFVLtrKrogg-Wxl9k",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NTgxMDQsImV4cCI6MTYxMzYyMjEwNCwibmJmIjoxNjEyNzU4MTA0LCJqdGkiOiJTV3pzMGpXajg5eU9iSjdXIiwic3ViIjoyNTc5NDUsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.Flmr_Cawsm4WCjsewE-Ee4HRSbCfT0V98R_WrLsC06Q",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NTg1MTUsImV4cCI6MTYxMzYyMjUxNSwibmJmIjoxNjEyNzU4NTE1LCJqdGkiOiJJQjN4cGo1U3ZmVUVibUdlIiwic3ViIjoyNTc5NTUsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.sD44zwQK1FnWC7L0JRT1GKEPOISw0y-f_XDaA7N083A",    
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NTkzMTgsImV4cCI6MTYxMzYyMzMxOCwibmJmIjoxNjEyNzU5MzE4LCJqdGkiOiIzZktReWVmanJFcXN5MUhqIiwic3ViIjoyNTc5NzMsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.O0a_baI8gCzMSfBFrjcNG7I-QQ1gOemrwuLxvnvaleE",

    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NjIxOTUsImV4cCI6MTYxMzYyNjE5NSwibmJmIjoxNjEyNzYyMTk1LCJqdGkiOiI3ZG5ZaVJRbW1ZTnd0OUZtIiwic3ViIjoyMzM3MDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.9cLa1Hkzi3an54CnRMKQSUlX_y-9fZBPMRWJfOFuDAQ",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NjIzOTEsImV4cCI6MTYxMzYyNjM5MSwibmJmIjoxNjEyNzYyMzkxLCJqdGkiOiI4d29HTzdKZFBkVGhYWkZlIiwic3ViIjoyNDY5OTQsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.x_u-gr2IWM5U4Gq4QslitJP4b--rpa8_yKrlPYxKfGI",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NjI1MzYsImV4cCI6MTYxMzYyNjUzNiwibmJmIjoxNjEyNzYyNTM2LCJqdGkiOiI0d0VVTzRYMHpJSXdBeFEyIiwic3ViIjoyNDY5OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.gWTYV7YELUAw6PAW3cAab1vF20kP_sK44n9k8TeTVuI",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NjI3NDIsImV4cCI6MTYxMzYyNjc0MiwibmJmIjoxNjEyNzYyNzQyLCJqdGkiOiJmSlNmWWdLV1BlejRFdVlzIiwic3ViIjoyMjE2MDIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.Au3PJS7ouzboEom563VvmjJbrpqNl5rZPN8tO0vinqE",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NjMwMTIsImV4cCI6MTYxMzYyNzAxMiwibmJmIjoxNjEyNzYzMDEyLCJqdGkiOiJTTTlmSWU0V0JFSThSU3IwIiwic3ViIjoyMzQ1OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.RbFpFLC_oeTx6AAjPgofMHfoha-8TfyKZc-fYk9qfZA",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NjMzNjAsImV4cCI6MTYxMzYyNzM2MCwibmJmIjoxNjEyNzYzMzYwLCJqdGkiOiJ4MG9tRklNdzJrMnlMa2wyIiwic3ViIjoxOTExNDgsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.7_Bsr2hdLt6WPHfJXtPegPKOmnboCpxZZAyPRhoX3DM",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NjM1MjAsImV4cCI6MTYxMzYyNzUyMCwibmJmIjoxNjEyNzYzNTIwLCJqdGkiOiJ0ZWI0N3lBMmFYa2MwUVVOIiwic3ViIjoyMzQ2MDEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.utbeT6IlepmuAlZN0eq-4Tm5D8CUq4OC_eWSIboiq2k",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTI3NjM5ODEsImV4cCI6MTYxMzYyNzk4MSwibmJmIjoxNjEyNzYzOTgxLCJqdGkiOiI2eWJuREU4bUp6UFg5UnVUIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.U6o2YFfaSWDlwDidcJNalv5YHuWk3JVlENFeGTAqAvg",    // "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTE4NDc5MTcsImV4cCI6MTYxMjcxMTkxNywibmJmIjoxNjExODQ3OTE3LCJqdGkiOiIwUTZMdnlhYkF2bmRHaGRYIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.j3I7R4BMMw9YyNuelJNtfnsnOk1_BNxjgRxG4DiZUzY",
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
                if (body && (typeof body != "string") && body.message == "未登录") {
                    logger.log('authorization==========>'+authorization)
                }
				if (!error) {
					try {
						return resolve (body||{});
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

    async checkBeiweiAsync (telNo) {

		telNo = parseInt (telNo) || 0;
		if (!telNo) {
			return Promise.resolve ({})
		}
	
		var body = `serviceId=${telNo}&payFee=10.00`

		var url = 'http://wx.bw30hl.com/weixin/payFeeAction.do?method=checkInfo&isPartlyRefresh=true';

		return new Promise ((resolve,reject) => {

			request.post (url,{
				headers : {
					'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat',
					'content-type': 'application/json;charset=UTF-8',
				},
                body : body,
                encoding : null,
			},(error, response, body) => {
				if (!error) {
					try {
                        var info =  iconv.decode(body, 'gb2312');
console.log(info)
						return resolve ({ret : info});
					} catch (e) {
						return resolve ({});
					}
				} else {
					return resolve ({err : error});
				}
			})
		})
	}
	
	async checkSingle (tel, reqType) {
        console.log('------checkSingle-----tel:'+tel+"===reqType:"+reqType)
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
        } else if (reqType == TYPE_BEIWEI) {
            info = await this.checkBeiweiAsync (tel);
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

	async dealBeiweiRetData (info, retdata, retrydata) {
        if (info.ret && info.ret.indexOf ('当前号码未开户') >= 0) {
            retdata.push({mobile:info.tel, status : '未激活'})
        } else if (info.ret && info.ret.indexOf ('被强制停机') >= 0) {
            retdata.push({mobile:info.tel, status : '√'})
        } else if (info.ret && info.ret == 1) {
            retdata.push({mobile:info.tel, status : '√'})
        } else {
            retdata.push({mobile:info.tel, status : '未知情况'})
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
            else if (reqType == TYPE_BEIWEI)
                this.dealBeiweiRetData(ret, retdata, retrydata)
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

async function getAllBeiWeiData (mobiles) {
    console.log('------getAllBeiWeiData-----')
    return new Promise ((resolve,reject) => {
        let chker = new TelChecker ((data) => {
            resolve (data);
        })
        chker.checkBatch(mobiles, TYPE_BEIWEI)
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
        console.log('------35-----')
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
        console.log('------hanghai-----')
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
        console.log('------hema-----')
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0');
        let mobiles = ctx.request.body.mobiles || '';//post
        logger.log(mobiles)

        let set = await database.findAndCheckExpire({code, ptype})
        if (!(set && set._id)) {
            ctx.body = {
                msg: "激活码已过期",
                ret: 2
            };
            return 
        } else {
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
        }
    })

    .post('/beiwei', async (ctx) => {
        console.log('------beiwei-----')
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0');
        let mobiles = ctx.request.body.mobiles || '';//post
        logger.log(mobiles)

        let set = await database.findAndCheckExpire({code, ptype})
        if (!(set && set._id)) {
            ctx.body = {
                msg: "激活码已过期",
                ret: 2
            };
            return 
        } else {
            let data = []
            let mobilesMap = {}
            for (let i in mobiles) {
                mobilesMap[mobiles[i]] = i
                data[i] = true
            }
            let resData = await getAllBeiWeiData(mobiles)
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

    
module.exports = tests