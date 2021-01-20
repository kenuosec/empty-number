
const Router = require('koa-router');
const database = require('../database');
let token_val = "12345"//TODO

function randomString(n) {
    let str = 'abcdefghijklmnopqrstuvwxyz9876543210';
    let tmp = '',
        i = 0,
        l = str.length;
    for (i = 0; i < n; i++) {
        tmp += str.charAt(Math.floor(Math.random() * l));
    }
    return tmp;
}

//子路由
let codes = new Router();
codes
    .post('/create', async (ctx) => {
        console.log(ctx.request.body)
        let token = ctx.request.body.token || '';
        let expire = parseInt(ctx.request.body.expire || '0');
        let ptype = parseInt(ctx.request.body.ptype || '0');
        console.log("token:" + token)

        if (token == token_val) {
            let code = randomString(16)
            let data = { code, expire, ptype }
            await database.create(data)
            ctx.body = {
                data,
                ret: 0
            };
        } else {
            ctx.body = {
                ret: 1,
                msg: "数据错误",
            };
        }
    })
    .post('/', async (ctx) => {
        console.log(ctx.request.body)
        let token = ctx.request.body.token || '';
        console.log("token:" + token)

        if (token == token_val) {
            let set = await database.find({})
            console.log(set)
            let data = []
            for (let i in set){
                let expire = set[i].expire
                let date = new Date(expire)
                let ptype = parseInt(set[i].ptype)
                data[i] = {code:set[i].code, expire, date:""+date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate(), typeName:(ptype==1)?"海航":"三五"}
            }
            ctx.body = {
                data,
                ret: 0
            };
        } else {
            ctx.body = {
                ret: 1,
                msg: "数据错误",
            };
        }
    })
    .post('/active', async (ctx) => {
        console.log(ctx.request.body)
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0')
        console.log("active code:" + code + "-ptype:" + ptype)

        let set = await database.findAndCheckExpire({code, ptype})
        console.log(set)

        if (set.length > 0) {
            ctx.body = {
                ret: 0,
                code: code,
            };
        } else {
            ctx.body = {
                ret: 1,
                msg: "激活码不存在或已过期",
            };
        }
    })

module.exports = codes