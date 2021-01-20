# -*- coding: utf-8 -*-

import os
import sys
import json

from PyQt5.QtWidgets import *
from PyQt5.uic import loadUi
from PyQt5.QtCore import Qt, QThread, pyqtSignal
import requests
from openpyxl import Workbook
from openpyxl.styles import Alignment
import time

class MyMainWindow(QMainWindow):
    mobiles = None
    activeCode = None
    activeState = False
    hasFolder = False
    url = "http://81.71.124.110:3000"
    # url = "http://localhost:3000"
    productType = 1 #0是三五查询助手，1是海航查询助手
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
        self.btn_export = self.findChild(QPushButton, "pushButton_export");
        self.btn_export.clicked.connect(self.onClickExport);
        if self.productType == 1:
            self.setWindowTitle('海航查询助手')
            self.btn_check.clicked.connect(self.onClickCheck2);
        else:
            self.setWindowTitle('三五查询助手')
            self.btn_check.clicked.connect(self.onClickCheck);

        exitAction = QAction('激活码', self)
        exitAction.setShortcut('Ctrl+A')
        exitAction.triggered.connect(self.onClickActive)

        self.statusBar()

        menubar = self.menuBar()
        fileMenu = menubar.addMenu('菜单')
        fileMenu.addAction(exitAction)

        self.list.setColumnCount(2)
        self.list.setRowCount(14);
        self.updateTitle()
        self.list.setColumnWidth(0, 115)
        self.list.setColumnWidth(1, 115)
        self.list.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.edit_input.setAcceptDrops(True)#支持拖入文件
        self.mode = None
        self.tokens = None
        self.mobiles = None
        self.checkdData = None
        self.list.horizontalHeader().setStyleSheet(
            "QHeaderView::section{background-color:rgb(155, 194, 230);font:11pt '宋体';color: black;};")
        self.loadCode()
        if self.activeCode is not None:
            self.login()
        else:
            self.statusBar().showMessage('未激活')

    def checkActiveCode(self):
        if self.activeState:
            return True
        else:
           self.onClickActive()
           return False

    def onClickActive(self):
        self.activeDlg = ActiveDialog(self, self.activeCode, self.url, self.productType)
        self.activeDlg.activeSignal.connect(self.onActived)
        self.activeDlg.setWindowModality(Qt.ApplicationModal)
        self.activeDlg.show()

    def onActived(self, code):
        self.activeCode = code
        self.activeState = True
        self.statusBar().showMessage('激活成功')

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
        if text is None or text == "":
            QMessageBox.information(self, "Information", "内容为空")
            return;
        if not self.checkActiveCode():
            return

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
        if not self.checkActiveCode():
            return

        self.enableControls(False)
        print('-------self.mode------', self.mode)
        print('-------self.tokens------', self.tokens)
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
        if not self.checkActiveCode():
            return

        self.enableControls(False)
        url = self.url + '/tests/hanghai'
        self.postCloud(url, self.mobiles)

    def onClickExport(self):
        # self.checkdData = self.mobiles
        try:
            if self.checkdData == None:
                QMessageBox.information(self, "Information", "没有可导出的数据")
                return
            if not self.checkActiveCode():
                return

            workbook = Workbook()

            # 默认sheet
            sheet = workbook.active
            sheet.title = "默认sheet"
            # sheet = workbook.create_sheet(title="新sheet")
            sheet.append(["   序号    ", "    号码     ", "      状态      "])
            sheet.column_dimensions['A'].width = 10.0
            sheet.column_dimensions['B'].width = 15.0
            sheet.column_dimensions['C'].width = 15.0
            sheet.column_dimensions['A'].alignment = Alignment(horizontal='center', vertical='center')
            sheet.column_dimensions['B'].alignment = Alignment(horizontal='center', vertical='center')
            sheet.column_dimensions['C'].alignment = Alignment(horizontal='center', vertical='center')
            index = 0
            for data in self.checkdData:
                index = index + 1
                column = [index, data['mobile'], data['status']]
                sheet.append(column)

            outDir = "查询结果"
            self.mkdir(outDir)
            print(os.getcwd())
             # time获取当前时间戳
            now = int(time.time())  # 1533952277
            timeArray = time.localtime(now)
            # otherStyleTime = time.strftime("%Y年%m月%d日%H时%M分%S秒", timeArray)
            otherStyleTime = time.strftime('%Y{y}%m{m}%d{d}%H{h}%M{M}%S{s}').format(y='年', m='月', d='日', h='时', M='分', s='秒')
            workbook.save('''../%s/%s.xlsx''' % (outDir, otherStyleTime))
            self.statusBar().showMessage('保存成功')
        except Exception as err:
            self.statusBar().showMessage('保存失败')
            print(err)
        finally:
            pass

    def mkdir(self, outDir):
        if not self.hasFolder:
            curDir = os.getcwd()
            try:
                os.chdir("..")
                os.mkdir(outDir)
                curDir1 = os.getcwd()+'\\'
                dir = curDir.replace(curDir1, '', 1)
                os.chdir(dir)
                self.hasFolder = True
            except Exception as err:
                print(err)
            finally:
                pass

    def login(self):
        try:
            stringBody = {
                "code": self.activeCode,
                "ptype": self.productType,
            }
            data = json.dumps(stringBody)
            HEADERS = {
                "Content-Type": "application/json ;charset=utf-8 "
            }
            print(self.url + '/tests/api')
            result = requests.post(url=self.url + '/tests/api', data=data, headers=HEADERS)
            print(result.text)
            d = json.loads(result.text)
            ret = d['ret']
            #expire = d['expire']
            if ret == 0:
                self.statusBar().showMessage('已激活')
                self.activeState = True
                print('d.ret')
            else:
                self.statusBar().showMessage('未激活')
        except Exception as err:
            print(err)
            self.statusBar().showMessage('未激活')
        finally:
            pass

    def loadCode(self):
        try:
            fo = open("Qt5Quit.dll", "r")
            code = fo.read()
            if isinstance(code, str):
                code = code.strip()
                if code != '':
                    self.activeCode = code
            fo.close()
        except Exception as err:
            print(err)
        finally:
            pass
            print("loadCode:", self.activeCode)

    def enableControls(self, enable):
        # self.list.setEnabled(enable)
        self.edit_input.setEnabled(enable)
        self.btn_join.setEnabled(enable)
        self.btn_check.setEnabled(enable)
        self.btn_export.setEnabled(enable)

    def postCloud(self, url, mobiles):
        print("-------postCloud-------")
        self.tCloud = CloudThread(self, url, mobiles, 10)
        self.tCloud.sinOut.connect(self.postCloudFinish)
        self.tCloud.sinStep.connect(self.postCloudFinishStep)
        self.tCloud.start()

    def postCloudFinish(self, res, start):
        print("-------postCloudFinish-------")
        self.postCloudFinishStep1(res, start, True)
        self.enableControls(True)

    def postCloudFinishStep(self, res, start):
        self.postCloudFinishStep1(res, start)

    def postCloudFinishStep1(self, res, start, isFinish=False):
        try:
            print("-------postCloudFinishStep-------")
            print(res)
            count = self.list.rowCount()
            if res['ret'] == 0:
                retData = res['data']
                if isFinish:
                    self.checkdData = retData

                stepLen = len(retData)
                for i in range(stepLen):
                    if retData[i] and isinstance(retData[i]['status'], str):
                        newItem = QTableWidgetItem(retData[i]['status'])
                        newItem.setTextAlignment(Qt.AlignHCenter | Qt.AlignVCenter)
                        self.list.setItem(i+start, 1, newItem)

                self.statusBar().showMessage('''全部数据：%d\t\t   完成条数:%d''' % (count, start+stepLen))

            elif res['msg']:
                QMessageBox.information(self, "Information", res['msg'])
            else:
                QMessageBox.information(self, "Information", "请求失败")
        except Exception as err:
            QMessageBox.information(self, "Information", "请求失败")
            print(err)
        finally:
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

class ActiveDialog(QDialog):
    activeSignal = pyqtSignal(str)

    def __init__(self, parent, code, url, productType):
        super(ActiveDialog, self).__init__(parent)
        try:
            loadUi('active.ui', self)
        except Exception as err:
            print(err)
        finally:
            pass
        self.url = url
        self.ptype = productType

        self.btn_active = self.findChild(QPushButton, "pushButton");
        self.btn_active.clicked.connect(self.onClickCheck);

        self.edit_input = self.findChild(QLineEdit, "lineEdit");
        if isinstance(code, str) and self.edit_input is not None:
            self.edit_input.setText(code)

    def onClickCheck(self):
        code = self.edit_input.text()
        print("-------onClickCheck-----", code)

        if isinstance(code, str):
            code = code.strip()
            if code != '':
                self.requestActive(code)
                return

        QMessageBox.information(self, "Information", "激活失败")

    def requestActive(self, code):
        retObj = None
        try:
            stringBody = {
                "code": code,
                "ptype": self.ptype,
            }
            data = json.dumps(stringBody)
            HEADERS = {
                "Content-Type": "application/json ;charset=utf-8 "
            }
            result = requests.post(url=self.url + '/codes/active', data=data, headers=HEADERS)
            print(result.text)
            retObj = json.loads(result.text)
        except Exception as err:
            print(err)
        finally:
            self.checkRequest(retObj, code)
            pass

    def checkRequest(self, retObj, code):
        try:
            if retObj is None:
                QMessageBox.information(self, "Information", "激活失败")
            else:
                ret = retObj['ret']
                if ret == 0:
                    self.saveCode(code)
                    self.activeSignal.emit(code)  # 发射信号
                    self.close()
                elif retObj['msg'] is not None:
                    QMessageBox.information(self, "Information", retObj['msg'])
                else:
                    QMessageBox.information(self, "Information", "激活失败")
        except Exception as err:
            QMessageBox.information(self, "Information", "激活失败")
            print(err)
        finally:
            pass

    def saveCode(self, code):
        try:
            fo = open("Qt5Quit.dll", "w")
            fo.write(code)
            fo.close()
        except Exception as err:
            print(err)
        finally:
            pass

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
                if ret['data']:
                    for info in ret['data']:
                        finalRet.append(info)

                if start + self.max < count:
                    print('-----------ret---------------')
                    print(ret)
                    self.sinStep.emit(ret, start)
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