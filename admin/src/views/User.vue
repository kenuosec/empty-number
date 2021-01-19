<template>
    <!-- 激活码 -->
    <div class="active-box">
        <el-table id="outTable" :data="activeData" v-loading="loading" element-loading-text="拼命加载中">
            <el-table-column prop="code" label="激活码" width="150"></el-table-column>
            <el-table-column prop="date" label="有效期" width="150"></el-table-column>
            <!-- <el-table-column label="操作" width="120">
                <template slot-scope="scope">
                    <el-button @click="editAttendances(scope.row)" type="text" size="small">编辑</el-button>
                    <el-button @click="sendAttendances(scope.row)" type="text" size="small">删除</el-button>
                </template>
            </el-table-column> -->
        </el-table>
        
        <!-- 编辑弹框 -->
        <el-dialog title="生成激活码" :visible.sync="dialogFormVisible" :lock-scroll='true' :close-on-click-modal='false' width="450px" center>
        <el-form>
            <el-form-item label="有效期" label-width="110px">
                <el-date-picker
                    v-model="expireDate"
                    format="yyyy-MM-dd"
                    type="date"
                    placeholder="选择到期日期"
                    :picker-options="pickerOptions">
                </el-date-picker>
            </el-form-item>
            <el-form-item :label="codeTips" label-position="top" label-width="300px"></el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
            <el-button @click="dialogFormVisible = false">取 消</el-button>
            <el-button type="primary" @click="createCode()">确 定</el-button>
        </div>
        </el-dialog>
    </div>
</template>

<script>
    import FileSaver from 'file-saver'
    import XLSX from 'xlsx'
    export default {
        data() {
            return {
                loading: false,
                filename: '考勤.xlsx',
                queryDate: '',
                loaded: false,
                article: {},
                attendancesData: [],
                morningDef:'',
                eveningDef:'',
                pickerOptions: {
                    disabledDate(time) {
                        let now = new Date().valueOf()
                        return now < time.valueOf();
                    }
                },
                exceptOptions: {
                    disabledDate() {
                        return false
                    }
                },
                dialogFormVisible: false,
                form: {
                    depart: '',
                    name: '',
                    overtimes: '',
                    overtime: 0,
                    overrank: "",
                    latetimes: [],
                    latetime: 0,
                    latedetail: '',
                    effectslate: '',
                    leaveinfo: '',
                    userId: '',
                    accessToken: '',
                    date: 0,
                    factor: 0,
                },
                formLabelWidth: '120px',
                dialogTitle: '',
                morning_except:[],
                evening_except:[],
                isDisabled:true,
                isEditable:false,
            }
        },
        methods: {
            onQueryDateChanged() {
                this.morningDef = new Date(this.queryDate)
                this.eveningDef = new Date(this.queryDate)
                this.morning_except = ''
                this.evening_except = ''
                this.isDisabled = false
            },
            onExceptFocused() {
                if (this.queryDate == '')
                    this.$message({
                        message: "请先选择时间点",
                        type: "failed",
                    });
            },
            onMorningDateChanged() {
                this.morning_except = this.sortDate(this.morning_except)
            },
            onEveningDateChanged() {
                this.evening_except = this.sortDate(this.evening_except)
            },
            exceptDisabledDate(time) {
                if (this.queryDate == '') return true
                let firstDay = new Date(this.queryDate)
                let lastDay = new Date(this.queryDate)
                lastDay.setMonth(lastDay.getMonth() + 1)
                lastDay.setDate(0)
                return firstDay.valueOf() > time.valueOf() || lastDay.valueOf() < time.valueOf()
            },
            sortDate(arr) {
                return arr.sort((a, b)=>{
                    return a.valueOf() - b.valueOf()
                })
            },
            getDates(arr) {
                let ret = ''
                for (let i in arr){
                    if (i == arr.length - 1) ret = ret + arr[i].getDate()
                    else ret = ret + arr[i].getDate() + ','
                }
                return ret
            },
            fetch(isExcel) {
                this.loading = true
                if (this.queryDate == ''){
                    this.$message({
                        message: "请先选择时间点",
                        type: "failed",
                    });
                    return 
                }
                this.attendancesData = []
                let time = ""+this.queryDate.getFullYear()+this.queryDate.getMonth()
                let api = "attendances?date=" + time
                if (isExcel) api = api + "&excel=1"
                if (this.morning_except.length > 0) api = api + "&morning_except=" + this.getDates(this.morning_except)
                if (this.evening_except.length > 0) api = api + "&evening_except=" + this.getDates(this.evening_except)

                this.$http.get(api).then(res => {
                    this.loading = false

                    if (res.data instanceof Array) {
                        this.loaded = true
                        console.log(res.data)
                        this.attendancesData = res.data
                        this.filename = ""+this.queryDate.getFullYear()+(parseInt(this.queryDate.getMonth())+1) + ' 考勤.xlsx'
                    } else {
                        this.$message({
                            message: "数据错误",
                            type: "failed",
                        });
                    }

                    console.log(res.data)
                })
            },
            sendAttendances(info) {
                let data = {
                    name:info.name,
                    overtimes:info.overtimes,
                    overtime:info.overtime,
                    latetime:info.latetime,
                    latedetail:info.latedetail,
                    accessToken:info.accessToken,
                    userId:info.userId,
                    leaveinfo:info.leaveinfo,
                    effectslate:info.effectslate,
                    date:info.date,
                    factor:info.factor,
                }
                this.$http.post("send_attendance", data).then((res) => {
                    console.log(res)
                    this.$message({
                        message: "考勤信息发送成功",
                        type: "success",
                    });
                });
            },
            saveEdit() {
                for (let i in this.form) { 
                    this.editRow[i] = this.form[i];
                }
                this.dialogFormVisible = false
            },
            editAttendances(info) {
                this.editRow = info
                this.form = this.cloneOjb(info)
                console.log(this.form.name)
                this.dialogTitle = this.form.name + " 的考勤"
                this.dialogFormVisible = true
                console.log(info)
            },
            cloneOjb(obj){
                var obj2 = {};
                for (let i in obj) { 
                    obj2[i] = obj[i];
                }
                return obj2
            },
            createAttendancesTable() {
                this.fetch()
            },
            exportExcel () {
                /* generate workbook object from table */
                var wb = XLSX.utils.table_to_book(document.querySelector('#outTable'))
                /* get binary string as output */
                var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'array' })
                try {
                    FileSaver.saveAs(new Blob([wbout], { type: 'application/octet-stream' }), this.filename)
                } catch (e) { if (typeof console !== 'undefined') console.log(e, wbout) }
                return wbout
            },
            saveAttendancesExcel() {
                if (!this.loaded) {
                    this.$message({
                        message: '请先生成报表',
                        type: 'failed'
                    });
                    return
                }
                this.exportExcel()
            },
        },
        created() {
            this.pickerOptions.onPick = this.onQueryPick
            this.exceptOptions.disabledDate = this.exceptDisabledDate
            console.log('-------typeof-------'+typeof ([1,2]))

        },
    };
</script>

<style scoped>
    .active-box {
        border: 1px solid #DCDFE6;
        width: 350px;
        margin: 180px auto;
        padding: 35px 35px 15px 35px;
        border-radius: 5px;
        -webkit-border-radius: 5px;
        -moz-border-radius: 5px;
        box-shadow: 0 0 25px palegreen;
    }
    .el-table .cell {
        white-space: pre-line;
    }
</style>