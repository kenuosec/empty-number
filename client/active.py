from PyQt5.uic import loadUi
from PyQt5.QtWidgets import *
import requests
import json
from PyQt5.QtCore import Qt, pyqtSignal

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
