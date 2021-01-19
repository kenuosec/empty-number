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
import os
import json

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *
from PyQt5.uic import loadUi
# from PyQt5.QtChart import QChartView, QLineSeries, QChart
# from main import *
import requests

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
        self.btn_export = self.findChild(QPushButton, "pushButton_export");
        self.btn_export.clicked.connect(self.onClickExport);
        self.list.setColumnCount(2)
        self.list.setRowCount(14);
        # self.list.setTextAlignment(Qt.AlignHCenter|Qt.AlignVCenter)
        self.list.setHorizontalHeaderLabels(['号码', '状态'])#'序号',
        self.list.setColumnWidth(0, 115)
        self.list.setColumnWidth(1, 115)
        self.list.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.edit_input.setAcceptDrops(True)#支持拖入文件
        self.url = "http://localhost:3000"
        self.code = 'B62A495B9CCA0041FC77D13651E7CFBB'

    def selectInfo(self):
        QMessageBox.information(self, "Information", "程序当前版本为V3.11")
        self.resultLabel.setText("Information")

    def onClickJoin(self):
        text = self.edit_input.toPlainText();
        if text == None or text == "":
            QMessageBox.information(self, "Information", "内容为空")
            return;

        arr = text.split( )
        print("=====len=======")
        print(len(arr))
        count = len(arr)
        self.list.setRowCount(count);
        for i in range(count):
            newItem = QTableWidgetItem(arr[i])
            self.list.setItem(i, 0, newItem)
            newItem = QTableWidgetItem("")
            self.list.setItem(i, 1, newItem)

    def onClickCheck(self):
        requests.post(url='https://swszxcx.35sz.net/api/v1/card-replacement/query', data={},
                      headers={'Content-Type': 'application/text/plain'})

    def onClickExport(self):
        print("onClickExport")
        self.login()

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
        if (d['ret'] == 0):
            self.tokens = d['tokens']
        elif d['sss']:
            QMessageBox.information(self, "Information", "登录失败")
        else

if __name__ == "__main__":
    app = QApplication(sys.argv)
    myWin = MyMainWindow()
    myWin.show()
    sys.exit(app.exec_())