const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('koa2-cors');
const login = require('./login');
const codes = require('./codes');
const tests = require('./tests');

app.use(bodyParser());
//这是处理前端跨域的配置
app.use(cors({
    origin: function (ctx) {
        // if (ctx.url === '/login') {
            return "*"; // 允许来自所有域名请求
        // }
        // return 'http://localhost:8080';
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
//总路由，装载子路由
let router = new Router();
router.use('/login', login.routes(), login.allowedMethods());
router.use('/codes', codes.routes(), codes.allowedMethods());
router.use('/tests', tests.routes(), tests.allowedMethods());

//加载路由中间件
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
    console.log('localhost:3000');
});

