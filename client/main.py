# -*- coding: utf-8 -*-

"""
Py40.com PyQt5 tutorial

In this example, we create a simple
window in PyQt5.

author: Jan Bodnar
website: py40.com
last edited: January 2015
"""
import sys
import json

from PyQt5.QtWidgets import *
from PyQt5.uic import loadUi
from PyQt5.QtCore import Qt, QThread, pyqtSignal
import requests
from openpyxl import Workbook
import _thread

class MyMainWindow(QMainWindow):

    def __init__(self, parent=None):
        super(MyMainWindow, self).__init__(parent)
        loadUi("main.ui", self)
        self.setFixedSize(self.width(), self.height())

        '''Widget'''
        self.list = self.findChild(QTableWidget, "tableWidget");
        self.edit_input = self.findChild(QTextEdit, "textEdit");
        self.btn_join = self.findChild(QPushButton, "pushButton_join");
        self.btn_join.clicked.connect(self.onClickJoin);
        self.btn_check = self.findChild(QPushButton, "pushButton_check");
        self.btn_check.clicked.connect(self.onClickCheck);
        self.btn_check2 = self.findChild(QPushButton, "pushButton_check_2");
        self.btn_check2.clicked.connect(self.onClickCheck2);
        self.btn_export = self.findChild(QPushButton, "pushButton_export");
        self.btn_export.clicked.connect(self.onClickExport);
        self.list.setColumnCount(2)
        self.list.setRowCount(14);
        self.updateTitle()
        self.list.setColumnWidth(0, 115)
        self.list.setColumnWidth(1, 115)
        self.list.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.edit_input.setAcceptDrops(True)#支持拖入文件
        # self.url = "http://81.71.124.110:3000"
        self.url = "http://localhost:3000"
        self.code = 'B62A495B9CCA0041FC77D13651E7CFBB'
        self.mobiles = None
        self.checkdData = None
        self.list.horizontalHeader().setStyleSheet(
            "QHeaderView::section{background-color:rgb(155, 194, 230);font:11pt '宋体';color: black;};")

    def updateTitle(self):
        self.list.setHorizontalHeaderLabels(['号码', '状态'])#'序号',

    def updateStatusBar(self):
        all = 0
        if self.mobiles != None:
            all = len(self.mobiles)
        self.statusBar().showMessage('''全部数据：%d''' % all)
        self.list.setHorizontalHeaderLabels(['号码', '状态'])#'序号',

    def onClickJoin(self):
        self.mobiles = None
        self.checkdData = None
        self.list.clear()
        self.updateTitle()
        text = self.edit_input.toPlainText();
        if text == None or text == "":
            QMessageBox.information(self, "Information", "内容为空")
            return;

        arr = text.split( )
        count = len(arr)
        self.list.setRowCount(count);
        self.mobiles = arr
        self.updateStatusBar()
        for i in range(count):
            newItem = QTableWidgetItem(arr[i])
            newItem.setTextAlignment(Qt.AlignHCenter|Qt.AlignVCenter)
            self.list.setItem(i, 0, newItem)

    def onClickCheck(self):
        print(self.mobiles)
        if self.mobiles is None:
            QMessageBox.information(self, "Information", "没有可检测的号码")
            return 
            
        self.enableControls(False)

        if self.mode == 1 and not self.tokens is None:
            self.postLocal(self.mobiles, self.tokens)
        else:
            url = self.url + '/tests'
            self.postCloud(url, self.mobiles)

    def onClickCheck2(self):
        print(self.mobiles)
        if self.mobiles is None:
            QMessageBox.information(self, "Information", "没有可检测的号码")
            return 
            
        self.enableControls(False)
        url = self.url + '/tests/hanghai'
        self.postCloud(url, self.mobiles)

    def onClickExport(self):
        if self.checkdData == None:
            QMessageBox.information(self, "Information", "没有可导出的数据")
            return

        workbook = Workbook()

        # 默认sheet
        sheet = workbook.active
        sheet.title = "默认sheet"
        # sheet = workbook.create_sheet(title="新sheet")
        sheet.append(["   序号    ", "    号码     ", "      状态      "])
        index = 0
        for data in self.checkdData:
            index = index + 1
            column = [index, data['mobile'], data['status']]
            sheet.append(column)

        workbook.save('../号码.xlsx')

    def login(self):
        # r = requests.post(url=self.url + '/tests/api', data={'code': self.code},  headers={'Content-Type': 'application/json'})
        # print(r.json())
        stringBody = {
            "code": self.code,
            # "username": self.code,
            # "password": self.code,
        }
        data = json.dumps(stringBody)
        HEADERS = {
            "Content-Type": "application/json ;charset=utf-8 "
        }
        print(self.url + '/tests/api')
        result = requests.post(url=self.url + '/tests/api', data=data, headers=HEADERS)
        # result = requests.post(url=self.url + '/login', data=data, headers=HEADERS)
        print(result.text)
        d = json.loads(result.text)
        if (d['ret'] == 0):
            print('d.ret')

    def loginAdmim(self):
        stringBody = {
            "code": self.code,
        }
        data = json.dumps(stringBody)
        HEADERS = {
            "Content-Type": "application/json ;charset=utf-8 "
        }
        print(self.url + '/tests/api')
        result = requests.post(url=self.url + '/tests/api', data=data, headers=HEADERS)
        d = json.loads(result.text)
        if d['ret'] == 0:
            self.tokens = d['tokens']
            self.mode = d['mode']
        elif d['msg']:
            QMessageBox.information(self, "Information", d['msg'])
        else:
            QMessageBox.information(self, "Information", "登录失败")

    def enableControls(self, enable):
        self.list.setEnabled(enable)
        self.edit_input.setEnabled(enable)
        self.btn_join.setEnabled(enable)
        self.btn_check.setEnabled(enable)
        self.btn_export.setEnabled(enable)

    def postCloud(self, url, mobiles):
        self.tCloud = CloudThread(self, url, mobiles)
        self.tCloud.sinOut.connect(self.postCloudFinish)
        self.tCloud.sinStep.connect(self.postCloudFinishStep)
        self.tCloud.start()

    def postCloudFinish(self, res, start):
        print("-------postCloudFinish-------")
        self.postCloudFinishStep(res, start)
        self.enableControls(True)

    def postCloudFinishStep(self, res, start):
        print("-------postCloudFinishStep-------")
        print(res)
        count = self.list.rowCount()
        if res['ret'] == 0:
            retData = res['data']
            self.checkdData = retData
            for i in range(count):
                if retData[i] and isinstance(retData[i]['status'], str):
                    newItem = QTableWidgetItem(retData[i]['status'])
                    newItem.setTextAlignment(Qt.AlignHCenter | Qt.AlignVCenter)
                    self.list.setItem(i+start, 1, newItem)
                pass
        elif res['msg']:
            QMessageBox.information(self, "Information", res['msg'])
        else:
            QMessageBox.information(self, "Information", "登录失败")
        pass

    def postLocal(self, mobiles, tokens):
        self.tLocal = LocalThread(self, mobiles, tokens)
        self.tLocal.sinOut.connect(self.postLocalFinish)
        self.tLocal.sinOne.connect(self.postLocalFinishOne)
        self.tLocal.start()
        pass

    def postLocalFinishOne(self, res):
        index = res['index']
        status = res['status']
        if isinstance(status, str):
            newItem = QTableWidgetItem(status)
            newItem.setTextAlignment(Qt.AlignHCenter | Qt.AlignVCenter)
            self.list.setItem(index, 1, newItem)
        self.updateStatusBar()

    def postLocalFinish(self, res):
        print("-------postLocalFinish-------")
        print(res)
        count = self.list.rowCount()
        if res['ret'] == 0:
            retData = res['data']
            self.checkdData = retData
            for i in range(count):
                if retData[i] and isinstance(retData[i]['status'], str):
                    newItem = QTableWidgetItem(retData[i]['status'])
                    newItem.setTextAlignment(Qt.AlignHCenter | Qt.AlignVCenter)
                    self.list.setItem(i, 1, newItem)
                pass
        elif res['msg']:
            QMessageBox.information(self, "Information", res['msg'])
        else:
            QMessageBox.information(self, "Information", "登录失败")

        self.enableControls(True)
        pass

    def postAll(self):
        if self.mode == 1:
            print('=============>')
        else:
            pass
        authorization = "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NTMxMTIsImV4cCI6MTYxMTcxNzExMiwibmJmIjoxNjEwODUzMTEyLCJqdGkiOiJpb2FUaUlXbWJaODJUTVNvIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c1nQrZb0eaifdcq47dVTlxVbkDayqckBDwbO2CdOVhc"
        r = requests.post(url='https://swszxcx.35sz.net/api/v1/card-replacement/query?mobile=16237397451', data={},
                      headers={'Content-Type': 'application/json', "Authorization": authorization})
        print(r.text)

class CloudThread(QThread):
    sinOut = pyqtSignal(dict, int)
    sinStep = pyqtSignal(dict, int)

    def __init__(self, parent, url, mobiles, max=500):
        super(CloudThread, self).__init__(parent)
        #设置工作状态与初始num数值
        self.working = True
        self.url = url
        self.max = max
        self.mobiles = mobiles

    def __del__(self):
        #线程状态改变与线程终止
        self.working = False
        self.wait()

    def split(self, start=0):
        print('------split---start-', start)
        mobiles = []
        count = len(self.mobiles)
        for i in range(self.max):
            if i+start < count:
                mobiles.append(self.mobiles[i+start])

        print('------split----')
        return mobiles

    def run(self):
        start = 0
        count = len(self.mobiles)
        finalRet = []
        # while self.working:
        while True:
            mobiles = self.split(start)
            ret = {"data": []}
            try:
                stringBody = {
                    "mobiles": mobiles,
                }
                data = json.dumps(stringBody)
                HEADERS = {
                    "Content-Type": "application/json ;charset=utf-8 "
                }
                result = requests.post(url=self.url, data=data, headers=HEADERS)
                ret = json.loads(result.text)
            except Exception as err:
                print(err)
            finally:
                print("-------finally-------")
                print(ret)
                print("-------finally-------")
                if ret['data']:
                    print("-------finally-------")
                    for info in ret['data']:
                        print("-------finally-------", info)
                        finalRet.append(info)

                if start + self.max < count:
                    # self.sinStep.emit(ret, start)
                    start = start+self.max
                else:
                    fRet = {"data": finalRet, "ret": 0}
                    self.sinOut.emit(fRet, 0)
                    self.working = False
                    break

class LocalThread(QThread):
    sinOut = pyqtSignal(dict)
    sinOne = pyqtSignal(dict)

    def __init__(self, parent, mobiles, tokens):
        super(LocalThread, self).__init__(parent)
        #设置工作状态与初始num数值
        self.working = True
        self.mobiles = mobiles
        self.tokens = tokens

    def __del__(self):
        #线程状态改变与线程终止
        self.working = False
        self.wait()

    def run(self):
        result = {"text": ""}
        tCount = len(self.tokens)
        for index in range(len(self.mobiles)):
            mobile = self.mobiles[index]
            try:
                authorization = self.tokens[index%tCount]#"BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NTMxMTIsImV4cCI6MTYxMTcxNzExMiwibmJmIjoxNjEwODUzMTEyLCJqdGkiOiJpb2FUaUlXbWJaODJUTVNvIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c1nQrZb0eaifdcq47dVTlxVbkDayqckBDwbO2CdOVhc"
                url = 'https://swszxcx.35sz.net/api/v1/card-replacement/query?mobile=%s' % mobile
                r = requests.post(url=url, data={}, headers={'Content-Type': 'application/json', "Authorization": authorization})
                print(r.text)
            except Exception as err:
                print(err);
            finally:
                print("-------finally-------")
                print(result)
                ret = json.loads(result.text)
                self.sinOut.emit(ret)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    myWin = MyMainWindow()
    myWin.show()
    sys.exit(app.exec_())