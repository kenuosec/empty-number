
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
            typeOptions: [{
                value: '0',
                label: '三五'
            }, {
                value: '1',
                label: '海航'
            }, {
                value: '2',
                label: '河马'
            }, {
                value: '4',
                label: '北纬'
            }, {
                value: '6',
                label: '朗玛'
            }],
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