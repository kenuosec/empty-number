
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
            let data = { code, expire, ptype, md5:'' }
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
                let expire = parseInt(set[i].expire)
                if (expire < 1011333842000 && expire >=3600000) {
                    let date = (expire == 3600000)?'1 小时':((expire/(24*3600000)).toFixed(0) + " 天") 
                    let ptype = parseInt(set[i].ptype)
                    let typeName = "三五"
                    if (ptype == 1) typeName = "海航"
                    else if (ptype == 2) typeName = "河马"
                    else if (ptype == 4) typeName = "北纬"
                    else if (ptype == 6) typeName = "朗玛"
                    else if (ptype == 7) typeName = "分享"
                    data.push({code:set[i].code, expire, date, typeName})
                }
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
        let md5 = ctx.request.body.md5 || '';
        let code = ctx.request.body.code || '';
        let ptype = parseInt(ctx.request.body.ptype || '0')
        console.log("active code:" + code + "-ptype:" + ptype)
        let version = 2

        let set = await database.findAndCheckExpire({code, ptype})
        console.log('set=========>')
        console.log(set)

        if (set && set._id) {
            console.log('md5=========>')
            console.log(set.md5)
            if (set.md5 == undefined || set.md5 == '' || md5 == set.md5) {
                if (set.md5 == undefined || set.md5 == '') {
                    let data = {
                        md5,
                        active_time : new Date().valueOf()
                    }
                    await database.findByIdAndUpdate(set._id, data)
                }
                ctx.body = {
                    ret: 0,
                    version,
                    code: code,
                };
            } else {
                ctx.body = {
                    ret: 1,
                    version,
                    msg: "激活码已在其他机器上激活",
                };
            }
        } else {
            ctx.body = {
                ret: 1,
                version,
                msg: "激活码不存在或已过期",
            };
        }
    })
    // .get('/', async (ctx) => {
    //     await database.drop()
    // })
    .get('/chaxun', async (ctx) => {
        let code = ctx.query.code || '';

        let data = await database.find({code})
        ctx.body = {
            data,
            ret: 0
        };
    })
module.exports = codes