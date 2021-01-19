
const Router = require('koa-router');
let token_val = "12345"//TODO
// const mongoose = require('mongoose');

// const dbOptions = {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// };
// mongoose.connect("mongodb://localhost/empty_number", dbOptions).then(
//     () => { console.info('MongoDB is ready'); },
//     err => { console.error('connect error:', err); }
// );
// const CodesModel = mongoose.model('codes', { code: String, expire: Number });

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
        let expire = ctx.request.body.expire || '';
        console.log("token:" + token)

        if (token == token_val) {
            let code = randomString(16)
            let data = { code, expire }
            await CodesModel.create(data)
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
            let set = await CodesModel.find()
            let data = []
            for (let i in set){
                let expire = set[i].expire
                let date = new Date(expire)
                data[i] = {code:set[i].code, expire, date:""+date.getFullYear()+"/"+(date.getMonth()+1)+"/"+date.getDate()}
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

module.exports = codes