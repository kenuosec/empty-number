
const Router = require('koa-router');
let token_val = "12345"//TODO
//子路由
let codes = new Router();
codes
    .post('/create',async(ctx)=>{
        console.log(ctx.request.body)
        let token = ctx.request.body.token || '';
        let date = ctx.request.body.date || '';
        console.log("token:"+token)

        if (token == token_val){
            let code = "1234"//TODO
            ctx.body = {
                data:{code, date},
                ret:0
            };
        } else {
            ctx.body={
                ret:1,
                msg:"数据错误",
            };
        }
    })
    .post('/',async(ctx)=>{
        console.log(ctx.request.body)
        let token = ctx.request.body.token || '';
        console.log("token:"+token)

        if (token == token_val){
            let data = [{code:'1234', date:""},{code:'1234', date:""}]//TODO
            ctx.body = {
                data,
                ret:0
            };
        } else {
            ctx.body={
                ret:1,
                msg:"数据错误",
            };

        }
    })

module.exports = codes