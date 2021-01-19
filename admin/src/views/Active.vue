<template>
    <el-form @submit.native.prevent ref="form" :model="article" label-width="80px">
        <el-form-item label="姓名">
            <el-input v-model="article.title"></el-input>
        </el-form-item>
        <el-form-item label="简介">
            <el-input autosize=true type="textarea" v-model="article.body"></el-input>
        </el-form-item>
        <el-form-item label="性别">
            <el-radio-group v-model="article.type">
                <el-radio label="男"></el-radio>
                <el-radio label="女"></el-radio>
                <el-radio label="秘密"></el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" native-type="submit" @click="saveArticle">提交</el-button>
            <el-button>取消</el-button>
        </el-form-item>
    </el-form>
</template>

<script>
export default {
    data() {
        return {
            article: {},
        };
    },
    methods: {
        saveArticle() {
            this.$http.post("article", this.article).then(() => {
                this.$message({
                    message: "文章创建成功",
                    type: "success",
                });
                this.$router.push("/article/index");
            });
        },
    },
};
</script>