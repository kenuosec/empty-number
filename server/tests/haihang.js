
const JSEncrypt = require('node-jsencrypt');
const request = require('request');
const fs = require('fs');
const xlsx = require('node-xlsx');

class TelChecker {
    constructor () {
		this.alldata = [];
		this.state = {
			current : 0,
			total : 0,
		}
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
		
				// console.log (body);
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
	
	async checkSingle (tel) {
		let info = await this.checkAsync (tel);
		console.log (info);
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

		let tbl_data = [
			['序号','号码', '是否激活'],
		];

		for (let i = 0 ;i < alldata.length ; i ++) {
			let info = alldata [i];
			let status = '';

            if (info.data && info.data.RESULT == '05') {
				status = '√'
            }

            if (info.data && info.data.RESULT == '03') {
                status = '未激活'
            }

			tbl_data.push ([
				i,
				info.tel,
				status,
			])
		}

		let buffer = xlsx.build([
			{
				name:'sheet1',
				data : tbl_data
			}
		]);
	
	
		let name = '航海数据.xlsx';
	
		fs.unlink (name,function () {
	
		})
		
		fs.writeFile (name,buffer,function (info) {
			console.info ("导出成功")
		});
	}

	async checkBatch (telNumbArray) {

		let BATCH_NUM = 200;
		let promises = [];

		for (let i = 0 ; i < BATCH_NUM ; i ++) {
			let tel = telNumbArray.pop ();
			if (tel) {
				promises.push (this.checkSingle (tel));
			}
		}

		let infos = await Promise.all (promises);
		this.alldata.push (...infos);

		let tellen = telNumbArray.length;
		if (tellen <= 0) {
			console.info ("检测完成,正在导出数据");
			this.exportToFile ();
			return ;
		}

		await this.delayTime (5000);

		this.checkBatch (telNumbArray);
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
