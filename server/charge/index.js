
const Router = require('koa-router');
const request = require('request');
const CryptoJS = require('crypto-js');
const database = require('../database');

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

let genOrderId = function() {
    return ""
}

async function requestCharge (mobile, value) {
    return new Promise ((resolve, reject) => {
        let url = "http://api.ejiaofei.net:11140/chongzhi_jkorders.do"
        let userid = '18593913229';
        let account = parseInt(mobile);
        let face = parseInt(value);
        let orderid = await database.create({face, account})
        let pwd = '6xHcT6ZNdFWWiZZ6misyWSXiQCZz62Yc';
        let md5str = CryptoJS.MD5("userid" + userid + "pwd" + pwd + "orderid" + orderid + "face" + face + "account" + account + "amount1BWaM7ThScfz54rNTkBecB88hQAyAXswb")
        let userkey = md5str.toLocaleUpperCase();
        let req_url = joinParams(url, {userid, pwd, orderid, face, account, amount:1, userkey})
        request.get(req_url, (error, response, body) => {
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

//子路由
let charge = new Router();
charge
    .post('/', async (ctx) => {
        let mobiles = (ctx.query.mobiles || '').split(',');//get
        let data = await requestCharge(mobiles)

        ctx.body = {
            data,
            ret: 0
        };
    })


