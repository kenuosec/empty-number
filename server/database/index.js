

const mongoose = require('mongoose');

const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify:true,
};
mongoose.connect("mongodb://localhost/empty_number", dbOptions).then(
    () => { console.info('MongoDB is ready'); },
    err => { console.error('connect error:', err); }
);
const CodesModel = mongoose.model('codes', { code: String, md5: String, expire: Number, ptype: Number });

let db = {}

db.find = async function(condition) {
    console.log(condition)
    return await CodesModel.find(condition)
}

db.findAndCheckExpire = async function(condition) {
    console.log(condition)
    let ret = await CodesModel.findOne(condition)
    console.log(ret)
    if (ret && ret._id){
        let data = ret
        let expire = parseInt(data.expire || 0)
        let cur = new Date().valueOf()
        console.log('----findAndCheckExpire----cur:'+cur + "---expire:"+expire)
        if (expire > cur) return ret
    }
    return {}
}

db.findByIdAndUpdate = async function(id, data) {
    await CodesModel.findByIdAndUpdate(id, data)
}

db.create = async function(data) {
    console.log(data)
    return await CodesModel.create(data)
}

db.drop = async function() {
    return await CodesModel.remove()
}

module.exports = db