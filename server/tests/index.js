const database = require('../database');

const Router = require('koa-router');
const JSEncrypt = require('node-jsencrypt');
const request = require('request');
const fs = require('fs');
const iconv = require('iconv-lite');

const CryptoJS = require('crypto-js');

const keyHex = CryptoJS.enc.Utf8.parse('dic12345678');

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
const TYPE_35_NEW = 5//35充值接口
let delay_between_request = [60000, 5000, 5000, 60000]

let curTokenIdx = 0
let tokens = [
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTM2NTkyMTYsImV4cCI6MTYxNDUyMzIxNiwibmJmIjoxNjEzNjU5MjE2LCJqdGkiOiJXUEZPaGNTQjZCNnFoRVlVIiwic3ViIjoyMzM3MDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.ODa7KiK5x61gOuDHuHMTdCK3FGPHftBCRrfOQjuh91M",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTM2NTk0MTUsImV4cCI6MTYxNDUyMzQxNSwibmJmIjoxNjEzNjU5NDE1LCJqdGkiOiJ6aDVWOTZWWGJOdEZ6SFRxIiwic3ViIjoxOTExNDgsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.wAELtYysTcCMg5bF2am6LtOuYJV_BcDpqHsf40tEDag",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTM2NTk2MDAsImV4cCI6MTYxNDUyMzYwMCwibmJmIjoxNjEzNjU5NjAwLCJqdGkiOiJkaW0yNzhQbU45MG91SlpqIiwic3ViIjoyNDY5OTIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.DuOJbc02WJFrTEk4q6GRptdxJ3isKk9vq8yW3qgULcI",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTM2NTk3MjUsImV4cCI6MTYxNDUyMzcyNSwibmJmIjoxNjEzNjU5NzI1LCJqdGkiOiJ3WTQweEh4ZWpjY3owWkxNIiwic3ViIjoyMzQ1OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.JaFPBX5KdBImPsAIuQVHcbMBBO3UfSdQEI2rUarRMMg",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTM2NTk5NTgsImV4cCI6MTYxNDUyMzk1OCwibmJmIjoxNjEzNjU5OTU4LCJqdGkiOiJmQnc0UmtQdTkzaEIwbUQ5Iiwic3ViIjoyNDY5OTQsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.HP85xhLa6D04jLI6M1ahnWqWqAYllyZx0R7rdLW_tlA",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTM2NjAxMTUsImV4cCI6MTYxNDUyNDExNSwibmJmIjoxNjEzNjYwMTE1LCJqdGkiOiJwQXliU3dNOFF0SWpMNG10Iiwic3ViIjoyNDY5OTcsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.2337kjUU3qMdfKW41PttPIcQbmXNKItDxdmNGQDs6ak",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTM2NjA0NzksImV4cCI6MTYxNDUyNDQ3OSwibmJmIjoxNjEzNjYwNDc5LCJqdGkiOiJyQUhkdzd6bTYyR1lCUWFrIiwic3ViIjoyNjI2MDUsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.kT9QiyYxS4psnR6LpWnyS1buHOGhSlJK0EJxazTnkmY",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTM2NjA1ODUsImV4cCI6MTYxNDUyNDU4NSwibmJmIjoxNjEzNjYwNTg1LCJqdGkiOiJHWGkzNTVWcWR6d0I3Y3dEIiwic3ViIjoyNjI2MDYsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.oPhqma-zMpc5o65vEwoENPsBIH5_g1DYdJ16G5CtMiU",
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

    //通过APP补卡接口
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
	
    UrlEncode(str) {
        str = (str + '').toString();   
    
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').  
        replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');  
    }

    //通过 http://www.35.net/web/ 充值接口
    async check35NewAsync (telNo) {
	
		if (!telNo) {
			return Promise.resolve ({})
		}
        var url = "http://www.35.net/web/recharge/rechargeNotLogin.html"
        //加密:
        const encrypted = CryptoJS.DES.encrypt(telNo, keyHex, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7 //填充方式
        });
        
        //解密:
        // const decrypted = CryptoJS.TripleDES.decrypt({
        //     ciphertext: CryptoJS.enc.Base64.parse(data)
        // }, keyHex, {
        //     mode: CryptoJS.mode.ECB,
        //     // padding: CryptoJS.pad.Pkcs7 这地方不用配置，我因为配置结果解密java返回的信息老是报错，看别人的代码加了，解析自已加密的没问题
        // });
        // const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
        // console.log('解密后的信息：',decryptedData)
        const rcgMobile = this.UrlEncode(encrypted.toString())
        // console.log('加密后的手机号：', rcgMobile) 

		return new Promise ((resolve, reject) => {

			request.post (url, {
				headers : {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
                },
                body:"orderRecharge.rcgMobile=" + rcgMobile + "&orderRecharge.rcgAmt=3QMWx%2BcPxmg%3D",
                // json: true,
			},(error, response, body) => {
				if (!error) {
					try {
                        if (-1 < body.indexOf("crmOrderNumber")){
                            return resolve ({status:"√"});
                        } else if (-1 < body.indexOf("亲，该号码为临时号码或待审核或预约拆机状态不允许充值！")){
                            return resolve ({status:"√"});
                        } else if (-1 < body.indexOf("亲，该号码不是三五通信手机号！")){
                            console.log("telNo:"+telNo+"===body"+body)
                            return resolve ({status:"未激活"});
                        } else {
                            console.log("异常35号码-telNo:"+telNo)
                            return resolve ({status:"未激活"});
                        }
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
        } else if (reqType == TYPE_35_NEW) {
            info = await this.check35NewAsync(tel)
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

	async deal35NewRetData (ret, retdata) {
        let mobile = ret.tel
        if (ret && ret.status) {
            retdata.push( { mobile, status: ret.status })
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
            else if (reqType == TYPE_35_NEW)
                this.deal35NewRetData(ret, retdata, retrydata)
                
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

async function getAll35NewHData (mobiles) {
    return new Promise ((resolve,reject) => {
        let chker = new TelChecker ((data) => {
            resolve (data);
        })
        chker.checkBatch(mobiles, TYPE_35_NEW)
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
    return new Promise ((resolve,reject) => {
        let chker = new TelChecker ((data) => {
            resolve (data);
        })
        chker.checkBatch(mobiles, TYPE_BEIWEI)
    })
}

//byCharge:走充值接口
async function get35Data (ctx, byCharge) {
    let code = ctx.request.body.code || '';
    let ptype = parseInt(ctx.request.body.ptype || '0');
    let mobiles = ctx.request.body.mobiles || '';//post

    let set = await database.findAndCheckExpire({code, ptype})
    if (! (set && set._id)) {
        ctx.body = {
            msg: "激活码已过期",
            ret: 2
        };
        return 
    } else {
        let data = []
        let mobilesMap = {}
        for (let i in mobiles) {
            data[i] = mobiles[i]
        }
        let resData = null
        if (byCharge) resData = await getAll35NewHData(mobiles)
        else resData = await getAll35HData(mobiles)

        for (let dt of resData) {
            mobilesMap[dt.mobile] = dt
        }
        let length = data.length
        for (let i = 0; i<length; i++) {
            data[i] = mobilesMap[data[i]]
        }
        ctx.body = {
            data,
            ret: 0
        };
    }
}

//子路由
let tests = new Router();
tests
    .get('/', async (ctx) => {
        let mobiles = (ctx.query.mobiles || '').split(',');//get
        let data = await getAll35HData(mobiles, 1)

        ctx.body = {
            data,
            ret: 0
        };
    })
    .post('/', async (ctx) => {
        console.log('------charge35-----')
        await get35Data(ctx, true)
    })
    .post('/notcharge', async (ctx) => {
        console.log('------35-----')
        await get35Data(ctx)
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
            let data = []
            let mobilesMap = {}
            for (let i in mobiles) {
                data[i] = mobiles[i]
            }
            let resData = await getAllHHData(mobiles)
            for (let dt of resData) {
                mobilesMap[dt.mobile] = dt
            }
            let length = data.length
            for (let i = 0; i<length; i++) {
                data[i] = mobilesMap[data[i]]
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
                data[i] = mobiles[i]
            }
            let resData = await getAllHeMaData(mobiles)
            for (let dt of resData) {
                mobilesMap[dt.mobile] = dt
            }
            let length = data.length
            for (let i = 0; i<length; i++) {
                data[i] = mobilesMap[data[i]]
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
                data[i] = mobiles[i]
            }
            let resData = await getAllBeiWeiData(mobiles)
            console.log('--------beiwei-----end--0-'+data.length)
            for (let dt of resData) {
                mobilesMap[dt.mobile] = dt
            }
            console.log('--------beiwei-----end--1-'+data.length)
            let length = data.length
            for (let i = 0; i<length; i++) {
                data[i] = mobilesMap[data[i]]
            }
            console.log('--------beiwei-----end---'+data.length)

            ctx.body = {
                data,
                ret: 0
            };
        }
    })

    
module.exports = tests