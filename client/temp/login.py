import json
import requests

from PyQt5 import QtCore, QtGui, QtWidgets, Qt
from PyQt5.QtGui import QIcon
from main import *
from PyQt5.QtWidgets import *
from PyQt5.QtCore import *

class LoginWindow(QtWidgets.QMainWindow):
    fileName = "Qt5Quit.dll"
    hasInited = False
    activeCode = None

    def __init__(self):
        super(LoginWindow,self).__init__()
        self.setupUi(self)
        self.retranslateUi(self)

    def setupUi(self, MainWindow):
        MainWindow.setObjectName("MainWindow")
        MainWindow.resize(278, 108)
        MainWindow.setWindowIcon(QIcon('logo.png'))
        MainWindow.setStyleSheet("background-image:url(Background.jpg)")
        self.centralWidget = QtWidgets.QWidget(MainWindow)
        self.centralWidget.setObjectName("centralWidget")
        self.label1 = QtWidgets.QLabel(self.centralWidget)
        self.label1.setGeometry(QtCore.QRect(70, 70, 141, 16))
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
        self.label.setText(_translate("MainWindow", "正在登录，请稍后..."))
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
            self.showInput()

    def showInput(self):
        self.lineEdit.setVisible(True)
        self.pushButton.setVisible(True)
        self.label1.setVisible(True)
        self.label.setVisible(False)
        pass

    def onClickCheck(self):
        code = self.lineEdit.text()
        print("-------onClickCheck-----", code)

        if isinstance(code, str):
            code = code.strip()
            if code != '':
                self.requestActive(code)
                return

    def requestLogin(self, code):
        print("-------requestLogin-------", code)
        self.tLogin = LoginThread(self, code)
        self.tLogin.sinOut.connect(self.onLoginFinish)
        self.tLogin.start()

    def onLoginFinish(self, ret):
        print("-------onLoginFinish-------", ret)
        if ret == 1:
            self.showInput()
        else:
            MainWindow.close()
            work.show()

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
    sinOut = pyqtSignal(int)

    def __init__(self, parent, code):
        super(LoginThread, self).__init__(parent)
        self.code = code

    def run(self):
        ret = -1
        try:
            stringBody = {
                "code": self.code,
                "ptype": productType,
            }
            data = json.dumps(stringBody)
            HEADERS = {
                "Content-Type": "application/json ;charset=utf-8 "
            }
            print(hostUrl + '/tests/api')
            result = requests.post(url=hostUrl + '/tests/api', data=data, headers=HEADERS)
            print(result.text)
            d = json.loads(result.text)
            ret = d['ret']
            if ret == 0:
                print('login ret:', ret)
            else:
                pass
        except Exception as err:
            print(err)
        finally:
            self.sinOut.emit(ret)

if __name__ == "__main__":
    import sys
    app = QtWidgets.QApplication(sys.argv)
    MainWindow = QtWidgets.QMainWindow()
    ui = LoginWindow()
    work = WorkWindow()
    ui.setupUi(MainWindow)
    MainWindow.show()
    sys.exit(app.exec_())