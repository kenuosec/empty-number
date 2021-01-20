const koa2Req = require('koa2-request')
const database = require('../database');

const Router = require('koa-router');
const JSEncrypt = require('node-jsencrypt');

let tokens = [
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NTMxMTIsImV4cCI6MTYxMTcxNzExMiwibmJmIjoxNjEwODUzMTEyLCJqdGkiOiJpb2FUaUlXbWJaODJUTVNvIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c1nQrZb0eaifdcq47dVTlxVbkDayqckBDwbO2CdOVhc",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NDcxOTIsImV4cCI6MTYxMTcxMTE5MiwibmJmIjoxNjEwODQ3MTkyLCJqdGkiOiJRcTFlWVowcTdlNnp3alF6Iiwic3ViIjoyMjc4NjksInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.kIPOFb0DapXViQ-GGiGI123c38mXAWccSwaai8wbDSU",
]

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
        let data = await postAll(mobiles)

        ctx.body = {
            data,
            ret: 0
        };
    })
    .post('/', async (ctx) => {
        let mobiles = ctx.request.body.mobiles || '';//post
        console.log(mobiles)
        let data = await postAll(mobiles, 1)

        ctx.body = {
            data,
            ret: 0
        };
    })
    .post('/api', async (ctx) => {
        console.log(ctx.request.body)
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

        let data = await postAllHanghai(mobiles)

        ctx.body = {
            data,
            ret: 0
        };
    })

    
module.exports = tests