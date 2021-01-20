
const Router = require('koa-router');

//子路由
let login = new Router();
login
.post('/',async(ctx)=>{
    console.log(ctx.request.body)
    let username = ctx.request.body.username || '';
    let password = ctx.request.body.password || '';

    if (username == "edu" && password == "BBbb123321@@"){
        let token = "12345"//TODO
        ctx.body = {
            token,
            ret:0
        };
    } else {
        ctx.body={
            ret:1,
            msg:"用户名或密码错误",
        };

    }
})

module.exports = login