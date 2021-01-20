

const mongoose = require('mongoose');

const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
mongoose.connect("mongodb://localhost/empty_number", dbOptions).then(
    () => { console.info('MongoDB is ready'); },
    err => { console.error('connect error:', err); }
);
const CodesModel = mongoose.model('codes', { code: String, expire: Number, ptype: Number });

let db = {}

db.find = async function(condition) {
    console.log(condition)
    return await CodesModel.find(condition)
}

db.findAndCheckExpire = async function(condition) {
    console.log(condition)
    let ret = await CodesModel.find(condition)
    console.log(ret)
    if (ret.length > 0){
        let data = ret[0]
        let expire = parseInt(data.expire || 0)
        let cur = new Date().valueOf()
        console.log('----findAndCheckExpire----cur:'+cur + "---expire:"+expire)
        if (expire > cur) return ret
    }
    return {}
}

db.create = async function(data) {
    console.log(data)
    return await CodesModel.create(data)
}

module.exports = db
