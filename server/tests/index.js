const koa2Req = require('koa2-request')

const Router = require('koa-router');

let tokens = [
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NTMxMTIsImV4cCI6MTYxMTcxNzExMiwibmJmIjoxNjEwODUzMTEyLCJqdGkiOiJpb2FUaUlXbWJaODJUTVNvIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c1nQrZb0eaifdcq47dVTlxVbkDayqckBDwbO2CdOVhc",
    "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NDcxOTIsImV4cCI6MTYxMTcxMTE5MiwibmJmIjoxNjEwODQ3MTkyLCJqdGkiOiJRcTFlWVowcTdlNnp3alF6Iiwic3ViIjoyMjc4NjksInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.kIPOFb0DapXViQ-GGiGI123c38mXAWccSwaai8wbDSU",
]

let joinParams = function(path, params) {
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
            "Authorization":authorization,
            'content-type': 'application/json',
        }
    }

    const res = await koa2Req(options)
    return res.body
}

async function post(mobile, token) {
    let url = `https://swszxcx.35sz.net/api/v1/card-replacement/query`
    let params = {mobile}
    let ret = await httpRequest(url, params, {}, token)
    if (ret && ret.step == "UPLOAD_IMAGES" && ret.session_id) {
        return mobile + "   √"
    } else if (ret && ret.message == "机主状态异常") {
        return mobile + "   √"
    } else if (ret && ret.message == "此号码不支持换卡") {
        return mobile + "   未激活"
    } else if (ret && ret.message == "Too Many Attempts.") {
        await delay(1000)
        return {mobile, retry:true}
    } else {
        return {mobile, ret, token}
    }
}

async function postAll(mobiles) {
    let arr = mobiles.split(',')
    const tCount = tokens.length
    const interval = tCount * 50
    
    let data = []
    let retrys = []
    for (let i in arr) {
        let mobile = arr[i]
        if (i % interval== 0 && i > 0) await delay(5000)
        
        const token = tokens[i%tCount]
        let ret = await post(mobile, token)
        if (typeof ret == "string") {
            console.log('--------00-------'+i)
            data[i] = ret
        } else if (ret.retry) {
            retrys[retrys.length] = {mobile, index:i}
            data[i] = "retry"
            console.log('--------retrys.length-------'+retrys.length)
        } else {
            console.log('--------11-------'+i)
            data[i] = ret
        }
    }

    let i = 0
    console.log('--------retrys.length-------'+retrys.length)
    while (i < retrys.length)
    {
        if (i % interval== 0) await delay(5000)
        let index = retrys[i].index
        let mobile = retrys[i].mobile
        const token = tokens[i%tCount]
        let ret = await post(mobile, token)

        if (typeof ret == "string") {
            data[index] = ret
            console.log('--------0-------'+index)
        } else if (ret.retry) {
            retrys[retrys.length] = {mobile, index}
            console.log('--------retrys.length-------'+retrys.length)
        } else {
            console.log('--------1-------'+index)
            data[index] = ret
        }
        i++;
        console.log('--------retrys.length-------i:'+i+"====retrys.length:"+retrys.length)
    }
    return data
}

function sleep(time) {
    return new Promise((resolve)=>{
        setTimeout(resolve, time);
    })
}

async function delay(time){
    return await sleep(time)
}

//子路由
let tests = new Router();
tests
.get('/',async(ctx)=>{
    let mobiles = ctx.query.mobiles || '';//get
    let data = await postAll(mobiles)

    ctx.body = {
        data,
        ret:0
    };
})
.post('/',async(ctx)=>{
    let mobiles = ctx.request.body.mobiles || '';//post
    let data = await postAll(mobiles)

    ctx.body = {
        data,
        ret:0
    };
})
.post('/api',async(ctx)=>{
    console.log(ctx.request.body)
    let code = ctx.request.body.code || '';

    if (code == "B62A495B9CCA0041FC77D13651E7CFBB"){
        ctx.body = {
            tokens,
            ret:0
        };
    } else {
        ctx.body={
            ret:1,
            msg:"激活码或不存在或已过期",
        };

    }
})

module.exports = tests