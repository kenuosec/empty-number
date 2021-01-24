<template>
    <div>
        <!-- 登录 -->
        <div class="login-box"  v-if="notLogined">
            <!-- 通过:rules="loginFormRules"来绑定输入内容的校验规则 -->
            <el-form
                :rules="loginFormRules"
                ref="loginForm"
                :model="loginForm"
                label-position="right"
                label-width="auto"
                show-message
            >
                <span class="login-title">欢迎登录</span>
                <div style="margin-top: 5px"></div>
                <el-form-item label="用户名" prop="username">
                    <el-col :span="22">
                        <el-input
                            type="text"
                            v-model="loginForm.username"
                        ></el-input>
                    </el-col>
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-col :span="22">
                        <el-input
                            type="password"
                            v-model="loginForm.password"
                        ></el-input>
                    </el-col>
                </el-form-item>
                <el-form-item>
                    <el-button class="btn-style" type="primary" @click="loginSubmit('loginForm')"
                        >登录</el-button
                    >
                   
                    <!-- <el-button type="primary" @click="regitSubmit('loginForm')"
                        >注册</el-button
                    > -->
                </el-form-item>
            </el-form>
        </div>

        <!-- 激活码 -->
        <div class="active-box"  v-if="!notLogined">
            <el-form @submit.native.prevent ref="form" label-width="80px">
                <el-form-item label="激活码：">
                <el-button type="primary" native-type="submit" @click="dialogFormVisible = true">生成激活码</el-button>
                </el-form-item>
            </el-form>
            <el-table id="outTable" :data="activeData.slice((currpage - 1) * pagesize, currpage * pagesize)" v-loading="loading" element-loading-text="拼命加载中">
                <el-table-column prop="code" label="激活码" width="200"></el-table-column>
                <el-table-column prop="date" label="有效期" width="150"></el-table-column>
                <el-table-column prop="typeName" label="类型" width="50"></el-table-column>
                <!-- <el-table-column label="操作" width="120">
                    <template slot-scope="scope">
                        <el-button @click="editAttendances(scope.row)" type="text" size="small">编辑</el-button>
                        <el-button @click="sendAttendances(scope.row)" type="text" size="small">删除</el-button>
                    </template>
                </el-table-column> -->
            </el-table>
            <el-pagination background 
                layout="prev, pager, next, total"
                :page-sizes="pagesizes"
                :page-size="pagesize"
                :total="activeData.length"
                @current-change="handleCurrentChange"  
                @size-change="handleSizeChange" 
                >
            </el-pagination>
            <!-- 编辑弹框 -->
            <el-dialog title="生成激活码" :visible.sync="dialogFormVisible" :lock-scroll='true' :close-on-click-modal='false' width="450px" @close='closeDialog' center>
            <el-form>
                <el-form-item label="有效期" label-width="110px">
                    <el-input
                            type="text"
                            v-model="expireDate"
                    ></el-input>
                    <!-- <el-date-picker
                        v-model="expireDate"
                        format="yyyy-MM-dd"
                        type="date"
                        placeholder="选择到期日期"
                        :picker-options="pickerOptions">
                    </el-date-picker> -->
                </el-form-item>
                <el-form-item label="类型" label-width="110px">
                    <el-select v-model="typeValue" placeholder="请选择">
                        <el-option
                            v-for="item in typeOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
                <span class="active-tips">{{codeTips}}</span>
                <!-- <span>codeTips1</span>
                <el-form-item label="" label-width="300px">"codeTips"</el-form-item>
                <el-form-item label="" label-position="left" label-width="300px">codeTips1</el-form-item> -->
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="closeDialog()">取 消</el-button>
                <el-button type="primary" @click="createCode()">生 成</el-button>
            </div>
            </el-dialog>
        </div>
    </div>
</template>
<script>
export default {
    name: "login",
    data() {
        return {
            notLogined:true,
            loginForm: {
                username: "",
                password: "",
            },
            token:'',
            // 表单验证，需要在 el-form-item 元素中增加 prop 属性
            loginFormRules: {
                username: [
                    {
                        required: true,
                        message: "账号不可为空",
                        trigger: "blur",
                    },
                ],
                password: [
                    {
                        required: true,
                        message: "密码不可为空",
                        trigger: "blur",
                    },
                ],
            },
            activeData: [],
            dialogFormVisible:false,
            expireDate:0,
            pickerOptions: {
                disabledDate(time) {
                    let now = new Date().valueOf()
                    return now >= time.valueOf();
                }
            },
            loading:false,
            codeTips:"",
            codeTips1:"",
            needFresh:false,

            typeOptions: [{
                value: '0',
                label: '三五'
            }, {
                value: '1',
                label: '海航'
            }, {
                value: '2',
                label: '河马'
            }],
            typeValue: '0',
            pagesize : 15,
            currpage: 1,
            pagesizes:[15],
        };
    },
    methods: {
        loginSubmit(formName) {
            // 为表单绑定验证功能
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    console.log(this.loginForm);
                    this.$http.post("login", this.loginForm).then((res) => {
                        console.log(res.data);
                        if (res && res.data && res.data.ret == 0){
                            this.notLogined = false;
                            this.token = res.data.token
                            this.requestCodes();
                            this.$message({
                                message: "登录成功",
                                type: "success",
                            });
                            // this.$router.replace("/loginSuccess");
                        } else {
                            this.$message({
                                message: res.data.msg || "登录失败",
                                type: "failed",
                            });
                        }
                    });
                } else {
                    return false;
                }
            });
        },
        regitSubmit(formName) {
            // 为表单绑定验证功能
            console.log(formName)
            this.$message({
                message: "暂不提供注册功能",
                type: "failed",
            });
            // this.$refs[formName].validate((valid) => {
            //     if (valid) {
            //         this.$message({
            //             message: "请联系管理员注册",
            //             type: "success",
            //         });
            //     } else {
            //         return false;
            //     }
            // });
        },
        createCode() {
            let expire = parseInt(this.expireDate) || 0
            if (this.expireDate == "0.1") expire = 3600000 
            else expire = expire*24*3600000 
            if (expire <= 0) {
                this.$message({
                    message: "请填写正确的有效期",
                    type: "failed",
                });
                return
            }
            let data = {token:this.token, expire:expire, ptype: this.typeValue}
            this.codeTips = ''
            this.codeTips1 = ''
            this.$http.post("codes/create", data).then((res) => {
                if (res && res.data && res.data.data) {
                    let code = res.data.data.code
                    let expire = res.data.data.expire
                    this.codeTips = '生成成功，激活码: ' + code +  "     有效期:"+expire+"天"
                    this.codeTips1 = ''
                    this.needFresh = true
                } else {
                    this.$message({
                        message: "数据错误",
                        type: "failed",
                    });
                }

                console.log(res.data)
             });
        },
        requestCodes() {
            this.$http.post("codes", {token:this.token}).then((res) => {
                 this.loading = false
                console.log(res.data)
                if (res && res.data && res.data.data instanceof Array) {
                    this.activeData = res.data.data
                    this.needFresh = false
                } else {
                    this.$message({
                        message: "数据错误",
                        type: "failed",
                    });
                }

                console.log(res.data)
            });
        },
        closeDialog() {
            this.dialogFormVisible = false
            if (this.needFresh) this.requestCodes()
        },
        handleCurrentChange(cpage) {
            this.currpage = cpage;
        },
        handleSizeChange(psize) {
            this.pagesize = psize;
        },
        handleSelectionChange(val) {
            console.log(val)
        }
    },
};
</script>
<style scoped>
.login-box {
    border: 1px solid #dcdfe6;
    width: 350px;
    margin: 180px auto;
    padding: 35px 35px 15px 35px;
    border-radius: 5px;
    -webkit-border-radius: 5px;
    -moz-border-radius: 5px;
    box-shadow: 0 0 25px palegreen;
}
.active-box {
    border: 1px solid #dcdfe6;
    width: 480px;
    margin: 180px auto;
    padding: 35px 35px 15px 35px;
    border-radius: 5px;
    -webkit-border-radius: 5px;
    -moz-border-radius: 5px;
    box-shadow: 0 0 25px #7b00cd;
}
.login-title {
    text-align: center;
    margin: 0 auto 40px auto;
    color: #66cd00;
    font-size: 30px;
    font-weight: bold;
}
.active-tips {
    text-align: center;
    margin: 100 auto 40px auto;
    color: #ff0000;
    font-size: 12px;
}
.btn-style{
    margin: 10px 20px 0px 80px;
}
</style>
