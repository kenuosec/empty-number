<template>
    <div>
        <el-form @submit.native.prevent ref="form" :model="article" label-width="80px">
            <el-form-item label="考勤：">
                <el-date-picker
                    v-model="queryDate"
                    :editable="isEditable"
                    format="yyyy-MM"
                    type="month"
                    placeholder="选择考勤时间"
                    @change="onQueryDateChanged"
                    :picker-options="pickerOptions">
                </el-date-picker> <span>   -    </span>
                <span>&nbsp;&nbsp;</span>
                <el-date-picker
                    v-model="morning_except"
                    :editable="isEditable"
                    :disabled="isDisabled"
                    format="d"
                    type="dates"
                    :default-value="morningDef"
                    placeholder="忽略上班卡日期"
                    @change="onMorningDateChanged"
                    :picker-options="exceptOptions">
                </el-date-picker>
                <span>   -    </span>
                <el-date-picker
                    v-model="evening_except"
                    :editable="isEditable"
                    :disabled="isDisabled"
                    format="d"
                    type="dates"
                    :default-value="eveningDef"
                    @change="onEveningDateChanged"
                    placeholder="忽略下班卡日期"
                    :picker-options="exceptOptions">
                </el-date-picker>
                <span>   -    </span>
                <el-button type="primary" native-type="submit" @click="createAttendancesTable">生成报表</el-button>
                <span>   -    </span>
                <el-button type="primary" native-type="submit" @click="saveAttendancesExcel">导出报表</el-button>
            </el-form-item>
        </el-form>
        <el-table id="outTable" :data="attendancesData" v-loading="loading" element-loading-text="拼命加载中">
            <el-table-column prop="depart" label="部门(组)" width="130"></el-table-column>
            <el-table-column prop="name" label="姓名" width="80"></el-table-column>
            <el-table-column prop="overtimes" label="加班次数" width="60"></el-table-column>
            <el-table-column prop="overtime" label="加班时长" width="130"></el-table-column>
            <el-table-column prop="overrank" label="加班排行" width="60"></el-table-column>
            <el-table-column prop="latetimes" label="迟到次数" width="60"></el-table-column>
            <el-table-column prop="latetime" label="迟到时长" width="90"></el-table-column>
            <el-table-column prop="latedetail" label="迟到明细(分钟)" width="400"></el-table-column>
            <el-table-column prop="effectslate" label="计薪考勤" width="280"></el-table-column>
            <el-table-column prop="leaveinfo" label="请假明细/备注" width="280"></el-table-column>
            <el-table-column prop="factor" label="考勤因子" width="60"></el-table-column>
            <el-table-column label="操作" width="120">
                <template slot-scope="scope">
                    <el-button @click="editAttendances(scope.row)" type="text" size="small">编辑</el-button>
                    <el-button @click="sendAttendances(scope.row)" type="text" size="small">通知 Ta</el-button>
                </template>
            </el-table-column>
        </el-table>
        
        <!-- 编辑弹框 -->
        <el-dialog :title="dialogTitle" :visible.sync="dialogFormVisible" :lock-scroll='true' :close-on-click-modal='false' center>
        <el-form :model="form">
            <el-form-item label="部门(组)" :label-width="formLabelWidth">
            <el-input v-model="form.depart" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="加班次数" :label-width="formLabelWidth">
            <el-input v-model="form.overtimes" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="加班时长" :label-width="formLabelWidth">
            <el-input v-model="form.overtime" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="加班排行" :label-width="formLabelWidth">
            <el-input v-model="form.overrank" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="迟到次数" :label-width="formLabelWidth">
            <el-input v-model="form.latetimes" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="迟到时长" :label-width="formLabelWidth">
            <el-input v-model="form.latetime" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="迟到明细(分钟)" :label-width="formLabelWidth">
            <el-input v-model="form.latedetail" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="计薪考勤" :label-width="formLabelWidth">
            <el-input v-model="form.effectslate" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="请假明细/备注" :label-width="formLabelWidth">
            <el-input v-model="form.leaveinfo" auto-complete="off"></el-input>
            </el-form-item>
            <el-form-item label="考勤因子" :label-width="formLabelWidth">
            <el-input v-model="form.factor" auto-complete="off"></el-input>
            </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
            <el-button @click="dialogFormVisible = false">取 消</el-button>
            <el-button type="primary" @click="saveEdit()">确 定</el-button>
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
    .el-table .cell {
        white-space: pre-line;
    }
</style>