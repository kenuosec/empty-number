# -*- coding: utf-8 -*-

# Form implementation generated from reading ui file 'active.ui'
#
# Created by: PyQt5 UI code generator 5.15.2
#
# WARNING: Any manual changes made to this file will be lost when pyuic5 is
# run again.  Do not edit this file unless you know what you are doing.


from PyQt5 import QtCore, QtGui, QtWidgets


class Ui_Dialog(object):
    def setupUi(self, Dialog):
        Dialog.setObjectName("Dialog")
        Dialog.resize(278, 108)
        self.lineEdit = QtWidgets.QLineEdit(Dialog)
        self.lineEdit.setGeometry(QtCore.QRect(72, 30, 141, 20))
        self.lineEdit.setObjectName("lineEdit")
        self.pushButton = QtWidgets.QPushButton(Dialog)
        self.pushButton.setGeometry(QtCore.QRect(110, 70, 75, 23))
        self.pushButton.setObjectName("pushButton")
        self.loginTips = QtWidgets.QLabel(Dialog)
        self.loginTips.setGeometry(QtCore.QRect(70, 40, 141, 16))
        self.loginTips.setAlignment(QtCore.Qt.AlignCenter)
        self.loginTips.setObjectName("loginTips")

        self.retranslateUi(Dialog)
        QtCore.QMetaObject.connectSlotsByName(Dialog)

    def retranslateUi(self, Dialog):
        _translate = QtCore.QCoreApplication.translate
        Dialog.setWindowTitle(_translate("Dialog", "激活码"))
        self.pushButton.setText(_translate("Dialog", "激  活"))
        self.loginTips.setText(_translate("Dialog", "正在登录，请稍后..."))