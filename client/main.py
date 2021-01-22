# -*- coding: utf-8 -*-

import os
import sys
import json
import win32api
import wmi

from PyQt5.uic import loadUi
from PyQt5 import QtCore, QtWidgets, Qt
from PyQt5.QtCore import Qt, QThread, pyqtSignal
import requests
from openpyxl import Workbook
from openpyxl.styles import Alignment
import time
from PyQt5.QtWidgets import *
# from PyQt5.QtGui import QIcon
import hashlib

global hostUrl, productType
hostUrl = "http://localhost:3000"#测试
# hostUrl = "http://81.71.124.110:3000"#正式
productType = 0 #0是三五查询助手，1是海航查询助手
class WorkWindow(QMainWindow):
    mobiles = None
    hasFolder = False

    def __init__(self, parent=None):
        super(WorkWindow, self).__init__(parent)
        loadUi("main.ui", self)
        self.setFixedSize(self.width(), self.height())

        '''Widget'''
        self.list = self.findChild(QTableWidget, "tableWidget")
        self.edit_input = self.findChild(QTextEdit, "textEdit")
        self.btn_join = self.findChild(QPushButton, "pushButton_join")
        self.btn_join.clicked.connect(self.onClickJoin)
        self.btn_check = self.findChild(QPushButton, "pushButton_check")
        self.btn_check.clicked.connect(self.onClickCheck)
        self.btn_export = self.findChild(QPushButton, "pushButton_export")
        self.btn_export.clicked.connect(self.onClickExport)
        if productType == 1:
            self.setWindowTitle('海航查询助手')
        else:
            self.setWindowTitle('三五查询助手')

        self.statusBar()

        menubar = self.menuBar()
        fileMenu = menubar.addMenu('菜单')
        exitAction = QAction('退出', self)
        exitAction.setShortcut('Ctrl+Q')
        exitAction.triggered.connect(qApp.quit)
        fileMenu.addAction(exitAction)

        self.list.setColumnCount(2)
        self.list.setRowCount(14)
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
        if productType == 1:
            self.onClickCheck2()
        else:
            self.onClickCheck1()

    def onClickCheck1(self):
        print(self.mobiles)
        if self.mobiles is None:
            QMessageBox.information(self, "Information", "没有可检测的号码")
            return 

        self.enableControls(False)
        self.statusBar().showMessage('''全部数据：%d\t\t   完成条数:0\t\t   已激活数:0\t\t   未激活数:0''' % len(self.mobiles))

        if self.mode == 1 and not self.tokens is None:
            self.postLocal(self.mobiles, self.tokens)
        else:
            url = hostUrl + '/tests'
            self.postCloud(url, self.mobiles, 200)

    def onClickCheck2(self):
        print(self.mobiles)
        if self.mobiles is None:
            QMessageBox.information(self, "Information", "没有可检测的号码")
            return 

        self.enableControls(False)
        self.statusBar().showMessage('''全部数据：%d\t\t   完成条数:0\t\t   已激活数:0\t\t   未激活数:0''' % len(self.mobiles))
        url = hostUrl + '/tests/hanghai'
        self.postCloud(url, self.mobiles)

    def onClickExport(self):
        # self.checkdData = self.mobiles
        try:
            if self.checkdData == None:
                QMessageBox.information(self, "Information", "没有可导出的数据")
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

    def enableControls(self, enable):
        # self.list.setEnabled(enable)
        self.edit_input.setEnabled(enable)
        self.btn_join.setEnabled(enable)
        self.btn_check.setEnabled(enable)
        self.btn_export.setEnabled(enable)

    def postCloud(self, url, mobiles, max=200):
        print("-------postCloud-------")
        try:
            self.tCloud = CloudThread(self, url, mobiles, max)
            self.tCloud.sinOut.connect(self.postCloudFinish)
            self.tCloud.sinStep.connect(self.postCloudFinishStep)
            self.tCloud.start()
        except Exception as err:
            print(err)
        finally:
            pass

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

                activeNum = 0
                stepLen = len(retData)
                for i in range(stepLen):
                    status = retData[i]['status']
                    if retData[i] and isinstance(status, str):
                        newItem = QTableWidgetItem(status)
                        newItem.setTextAlignment(Qt.AlignHCenter | Qt.AlignVCenter)
                        self.list.setItem(i, 1, newItem)
                        if status == '√':
                            activeNum = activeNum + 1

                self.statusBar().showMessage('''全部数据：%d\t\t   完成条数:%d\t\t   已激活数:%d\t\t   未激活数:%d''' % (count, stepLen, activeNum, stepLen-activeNum))

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
        try:
            if self.mode == 1:
                print('=============>')
            else:
                pass
            authorization = "BearereyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvc3dzenhjeC4zNXN6Lm5ldFwvYXBpXC92MVwvYXV0aFwvbG9naW4iLCJpYXQiOjE2MTA4NTMxMTIsImV4cCI6MTYxMTcxNzExMiwibmJmIjoxNjEwODUzMTEyLCJqdGkiOiJpb2FUaUlXbWJaODJUTVNvIiwic3ViIjoyMjc5OTEsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.c1nQrZb0eaifdcq47dVTlxVbkDayqckBDwbO2CdOVhc"
            r = requests.post(url='https://swszxcx.35sz.net/api/v1/card-replacement/query?mobile=16237397451', data={},
                        headers={'Content-Type': 'application/json', "Authorization": authorization})
            print(r.text)
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
                    print('-----------ret---------------', ret)
                    fRet = {"data": finalRet, "ret": 0}
                    self.sinStep.emit(fRet, start)
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


class LoginWindow(QtWidgets.QMainWindow):
    fileName = "Qt5Quit.dll"
    hasInited = False
    activeCode = None
    md5str = None

    def __init__(self):
        super(LoginWindow,self).__init__()
        self.setupUi(self)
        self.retranslateUi(self)

    def setupUi(self, MainWindow):
        MainWindow.setObjectName("MainWindow")
        MainWindow.resize(278, 108)
        # MainWindow.setWindowIcon(QIcon('logo.png'))
        # MainWindow.setStyleSheet("background-image:url(Background.jpg)")
        self.centralWidget = QtWidgets.QWidget(MainWindow)
        self.centralWidget.setObjectName("centralWidget")
        self.label1 = QtWidgets.QLabel(self.centralWidget)
        self.label1.setGeometry(QtCore.QRect(70, 50, 141, 16))
        self.label1.setStyleSheet("font:9pt '楷体'; color: rgb(255, 0, 0);")
        self.label1.setTextFormat(QtCore.Qt.AutoText)
        self.label1.setObjectName("label1")
        self.lineEdit = QtWidgets.QLineEdit(self.centralWidget)
        self.lineEdit.setGeometry(QtCore.QRect(72, 30, 141, 20))
        self.lineEdit.setText("")
        self.lineEdit.setObjectName("lineEdit")
        self.label = QtWidgets.QLabel(self.centralWidget)
        self.label.setGeometry(QtCore.QRect(70, 40, 141, 16))
        self.label.setTextFormat(QtCore.Qt.AutoText)
        self.label.setAlignment(QtCore.Qt.AlignCenter)
        self.label.setObjectName("label")
        self.pushButton = QtWidgets.QPushButton(self.centralWidget)
        self.pushButton.setGeometry(QtCore.QRect(110, 70, 75, 23))
        self.pushButton.setObjectName("pushButton")
        MainWindow.setCentralWidget(self.centralWidget)

        self.pushButton.clicked.connect(self.onClickCheck)

        self.retranslateUi(MainWindow)
        QtCore.QMetaObject.connectSlotsByName(MainWindow)

    def retranslateUi(self, MainWindow):
        _translate = QtCore.QCoreApplication.translate
        MainWindow.setWindowTitle(_translate("MainWindow", "请登录"))
        self.lineEdit.setPlaceholderText(_translate("MainWindow", "请输入激活码"))
        self.label.setText(_translate("MainWindow", "正在登录，请稍候..."))
        # self.label1.setText(_translate("MainWindow", "激活码无效或已过期"))
        self.pushButton.setText(_translate("MainWindow", "激  活"))

        self.ptype = productType

        self.label1.hide()
        self.lineEdit.hide()
        self.pushButton.setVisible(False)

        if not self.hasInited:
            self.loadCode()
        if self.activeCode is not None:
            if self.hasInited:
                return 
            self.hasInited = True
            self.requestLogin(self.activeCode)
            pass
        else:
            self.showInput(None)

    def showInput(self, msg):
        self.lineEdit.setVisible(True)
        self.pushButton.setVisible(True)
        self.label.setVisible(False)
        if msg is None or msg == '':
            self.label1.setVisible(False)
        else:
            self.label1.setVisible(True)
            self.label1.setText(msg)

        pass

    def onClickCheck(self):
        code = self.lineEdit.text()
        print("-------onClickCheck-----", code)

        if isinstance(code, str):
            code = code.strip()
            if code != '':
                self.requestLogin(code)
                return
 
    def requestLogin(self, code):
        self.label1.setVisible(False)
        print("-------requestLogin-------", code)
        if self.md5str is None:
            self.md5str = self.md5vale()
        try:
            self.tLogin = LoginThread(self, code, self.md5str)
            self.tLogin.sinOut.connect(self.onLoginFinish)
            self.tLogin.start()
        except Exception as err:
            print(err)
        finally:
            pass

    def getHardDiskNumber(self):
        ret = ''
        try:
            c = wmi.WMI()
            for physical_disk in c.Win32_DiskDrive():
                ret = physical_disk.SerialNumber
                break;
            print('')
        except Exception as err:
            print(err)
        finally:
            return ret

    def getCVolumeSerialNumber(self):
        CVolumeSerialNumber = 0
        try:
            CVolumeSerialNumber = win32api.GetVolumeInformation("C:\\")[1]
        except Exception as err:
            print(err)
        finally:
            if CVolumeSerialNumber is None:
                CVolumeSerialNumber = 0
            return str(CVolumeSerialNumber)

    def md5vale(self):
        key = self.getHardDiskNumber()
        if key == '':
            key = self.getCVolumeSerialNumber() + ''
        print('md5vale=======', key)
        input_name = hashlib.md5()
        input_name.update(key.encode("utf-8"))
        return input_name.hexdigest()

    def onLoginFinish(self, ret):
        print("-------onLoginFinish-------", ret)
        try:
            if ret['ret'] == 0 or True:
                self.saveCode(ret['code'])
                MainWindow.close()
                work.show()
            else:
                msg = ret['msg']
                self.showInput(msg)
        except Exception as err:
            print(err)
        finally:
            pass

    def loadCode(self):
        code = None
        try:
            fo = open(self.fileName, "r")
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

    def saveCode(self, code):
        try:
            fo = open(self.fileName, "w")
            fo.write(code)
            fo.close()
        except Exception as err:
            print(err)
        finally:
            pass

class LoginThread(QThread):
    sinOut = pyqtSignal(dict)

    def __init__(self, parent, code, md5):
        super(LoginThread, self).__init__(parent)
        self.code = code
        self.md5 = md5

    def run(self):
        ret = -1
        msg = ''
        try:
            stringBody = {
                "md5": self.md5,
                "code": self.code,
                "ptype": productType,
            }
            data = json.dumps(stringBody)
            HEADERS = {
                "Content-Type": "application/json ;charset=utf-8 "
            }
            print(hostUrl + '/codes/active')
            result = requests.post(url=hostUrl + '/codes/active', data=data, headers=HEADERS)
            print(result.text)
            d = json.loads(result.text)
            ret = d['ret']
            if ret == 0:
                print('login ret:', ret)
            else:
                msg = d['msg']
                pass
        except Exception as err:
            print(err)
            msg = '网络错误'
        finally:
            fRet = {
                "ret": ret,
                "code": self.code,
                "msg": msg
            }
            self.sinOut.emit(fRet)

if __name__ == "__main__":
    import sys
    app = QtWidgets.QApplication(sys.argv)
    MainWindow = QtWidgets.QMainWindow()
    ui = LoginWindow()
    work = WorkWindow()
    ui.setupUi(MainWindow)
    MainWindow.show()
    sys.exit(app.exec_())