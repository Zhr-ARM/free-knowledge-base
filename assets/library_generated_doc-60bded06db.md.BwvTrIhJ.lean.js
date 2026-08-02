import{g as s,o as l,c as d,j as n,a as t,k as u,a5 as p,t as i}from"./chunks/framework.B5tqjWbr.js";const w={class:"kb-download-actions"},c=["href"],m={class:"kb-archive-preview"},b={class:"kb-source-previews","aria-labelledby":"doc-60bded06db-source-heading"},_={class:"kb-preview-panel kb-code-preview",open:""},E=["textContent"],Q={class:"kb-preview-panel kb-code-preview"},g=["textContent"],W={class:"kb-preview-panel kb-code-preview"},f=["textContent"],M={class:"kb-preview-panel kb-code-preview"},B=["textContent"],A={class:"kb-preview-panel kb-code-preview"},C=["textContent"],h={class:"kb-preview-panel kb-code-preview"},I=["textContent"],x=JSON.parse('{"title":"QT入门示例源码","description":"嵌入式 / Linux与Qt / Qt · ZIP · 6.0 KB","frontmatter":{"search":false,"aside":false,"pageClass":"kb-wide-document","title":"QT入门示例源码","description":"嵌入式 / Linux与Qt / Qt · ZIP · 6.0 KB","searchTitle":"QT入门示例源码","searchPath":"嵌入式 / Linux与Qt / Qt","searchType":"ZIP"},"headers":[],"relativePath":"library/generated/doc-60bded06db.md","filePath":"library/generated/doc-60bded06db.md","lastUpdated":null}'),N={name:"library/generated/doc-60bded06db.md"},S=Object.assign(N,{setup(T){const a=s("/uploads/raw/%E5%B5%8C%E5%85%A5%E5%BC%8F/07-Linux%E4%B8%8EQt/Qt/QT%E5%85%A5%E9%97%A8%E7%A4%BA%E4%BE%8B%E6%BA%90%E7%A0%81.zip"),o=`  30.4 KB  build-first-Desktop_Qt_5_14_2_MinGW_32_bit-Debug/Makefile
   2.2 KB  build-first-Desktop_Qt_5_14_2_MinGW_32_bit-Debug/ui_mainwindow.h
   1021 B  first/first.pro
    183 B  first/main.cpp
    236 B  first/mainwindow.cpp
    344 B  first/mainwindow.h
   1.0 KB  first/mainwindow.ui
    299 B  README.txt`,r=[`QT入门示例源码

本压缩包由开源协会知识库从学习目录中自动精选生成。
已排除安装包、视频、编译缓存、目标文件、可执行文件、私钥和大型第三方依赖。
部分工程需要通过对应 IDE、SDK 或配置文件重新生成依赖后再编译。`,`#include "mainwindow.h"\r
\r
#include <QApplication>\r
\r
int main(int argc, char *argv[])\r
{\r
    QApplication a(argc, argv);\r
    MainWindow w;\r
    w.show();\r
    return a.exec();\r
}\r
`,`#include "mainwindow.h"\r
#include "ui_mainwindow.h"\r
\r
MainWindow::MainWindow(QWidget *parent)\r
    : QMainWindow(parent)\r
    , ui(new Ui::MainWindow)\r
{\r
    ui->setupUi(this);\r
}\r
\r
MainWindow::~MainWindow()\r
{\r
    delete ui;\r
}\r
\r
`,`/********************************************************************************\r
** Form generated from reading UI file 'mainwindow.ui'\r
**\r
** Created by: Qt User Interface Compiler version 5.14.2\r
**\r
** WARNING! All changes made in this file will be lost when recompiling UI file!\r
********************************************************************************/\r
\r
#ifndef UI_MAINWINDOW_H\r
#define UI_MAINWINDOW_H\r
\r
#include <QtCore/QVariant>\r
#include <QtWidgets/QApplication>\r
#include <QtWidgets/QMainWindow>\r
#include <QtWidgets/QMenuBar>\r
#include <QtWidgets/QRadioButton>\r
#include <QtWidgets/QStatusBar>\r
#include <QtWidgets/QWidget>\r
\r
QT_BEGIN_NAMESPACE\r
\r
class Ui_MainWindow\r
{\r
public:\r
    QWidget *centralwidget;\r
    QRadioButton *radioButton;\r
    QMenuBar *menubar;\r
    QStatusBar *statusbar;\r
\r
    void setupUi(QMainWindow *MainWindow)\r
    {\r
        if (MainWindow->objectName().isEmpty())\r
            MainWindow->setObjectName(QString::fromUtf8("MainWindow"));\r
        MainWindow->resize(800, 600);\r
        centralwidget = new QWidget(MainWindow);\r
        centralwidget->setObjectName(QString::fromUtf8("centralwidget"));\r
        radioButton = new QRadioButton(centralwidget);\r
        radioButton->setObjectName(QString::fromUtf8("radioButton"));\r
        radioButton->setGeometry(QRect(180, 180, 69, 15));\r
        MainWindow->setCentralWidget(centralwidget);\r
        menubar = new QMenuBar(MainWindow);\r
        menubar->setObjectName(QString::fromUtf8("menubar"));\r
        menubar->setGeometry(QRect(0, 0, 800, 21));\r
        MainWindow->setMenuBar(menubar);\r
        statusbar = new QStatusBar(MainWindow);\r
        statusbar->setObjectName(QString::fromUtf8("statusbar"));\r
        MainWindow->setStatusBar(statusbar);\r
\r
        retranslateUi(MainWindow);\r
\r
        QMetaObject::connectSlotsByName(MainWindow);\r
    } // setupUi\r
\r
    void retranslateUi(QMainWindow *MainWindow)\r
    {\r
        MainWindow->setWindowTitle(QCoreApplication::translate("MainWindow", "MainWindow", nullptr));\r
        radioButton->setText(QCoreApplication::translate("MainWindow", "RadioButton", nullptr));\r
    } // retranslateUi\r
\r
};\r
\r
namespace Ui {\r
    class MainWindow: public Ui_MainWindow {};\r
} // namespace Ui\r
\r
QT_END_NAMESPACE\r
\r
#endif // UI_MAINWINDOW_H\r
`,`#ifndef MAINWINDOW_H\r
#define MAINWINDOW_H\r
\r
#include <QMainWindow>\r
\r
QT_BEGIN_NAMESPACE\r
namespace Ui { class MainWindow; }\r
QT_END_NAMESPACE\r
\r
class MainWindow : public QMainWindow\r
{\r
    Q_OBJECT\r
\r
public:\r
    MainWindow(QWidget *parent = nullptr);\r
    ~MainWindow();\r
\r
private:\r
    Ui::MainWindow *ui;\r
};\r
#endif // MAINWINDOW_H\r
`,`QT       += core gui\r
\r
greaterThan(QT_MAJOR_VERSION, 4): QT += widgets\r
\r
CONFIG += c++11\r
\r
# The following define makes your compiler emit warnings if you use\r
# any Qt feature that has been marked deprecated (the exact warnings\r
# depend on your compiler). Please consult the documentation of the\r
# deprecated API in order to know how to port your code away from it.\r
DEFINES += QT_DEPRECATED_WARNINGS\r
\r
# You can also make your code fail to compile if it uses deprecated APIs.\r
# In order to do so, uncomment the following line.\r
# You can also select to disable deprecated APIs only up to a certain version of Qt.\r
#DEFINES += QT_DISABLE_DEPRECATED_BEFORE=0x060000    # disables all the APIs deprecated before Qt 6.0.0\r
\r
SOURCES += \\\r
    main.cpp \\\r
    mainwindow.cpp\r
\r
HEADERS += \\\r
    mainwindow.h\r
\r
FORMS += \\\r
    mainwindow.ui\r
\r
# Default rules for deployment.\r
qnx: target.path = /tmp/$\${TARGET}/bin\r
else: unix:!android: target.path = /opt/$\${TARGET}/bin\r
!isEmpty(target.path): INSTALLS += target\r
`];return(k,e)=>(l(),d("div",null,[e[9]||(e[9]=n("h1",{id:"qt入门示例源码",tabindex:"-1"},[t("QT入门示例源码 "),n("a",{class:"header-anchor",href:"#qt入门示例源码","aria-label":'Permalink to "QT入门示例源码"'},"​")],-1)),e[10]||(e[10]=n("div",{class:"kb-file-meta"},[n("span",null,[n("strong",null,"目录"),t("嵌入式 / Linux与Qt / Qt")]),n("span",null,[n("strong",null,"格式"),t("ZIP")]),n("span",null,[n("strong",null,"大小"),t("6.0 KB")])],-1)),n("p",w,[n("a",{class:"kb-download-button kb-download-button-secondary",href:u(a),download:""},"下载完整源码包",8,c)]),e[11]||(e[11]=n("h2",{id:"在线预览",tabindex:"-1"},[t("在线预览 "),n("a",{class:"header-anchor",href:"#在线预览","aria-label":'Permalink to "在线预览"'},"​")],-1)),e[12]||(e[12]=n("div",{class:"kb-preview-summary"},[n("span",null,[n("strong",null,"8"),t(" 个文件")]),n("span",null,[n("strong",null,"2"),t(" 个目录")]),n("span",null,[n("strong",null,"35.7 KB"),t(" 解压后大小")])],-1)),n("div",m,[e[8]||(e[8]=p("",1)),n("details",{class:"kb-preview-panel kb-archive-index"},[e[0]||(e[0]=n("summary",null,"查看完整目录 · 8 个文件",-1)),n("pre",{textContent:o})]),n("section",b,[e[7]||(e[7]=n("h3",{id:"doc-60bded06db-source-heading"},"可读文件预览",-1)),n("details",_,[e[1]||(e[1]=n("summary",null,[n("span",null,"README.txt"),n("small",null,"299 B")],-1)),n("pre",null,[n("code",{textContent:i(r[0])},null,8,E)])]),n("details",Q,[e[2]||(e[2]=n("summary",null,[n("span",null,"first/main.cpp"),n("small",null,"183 B")],-1)),n("pre",null,[n("code",{textContent:i(r[1])},null,8,g)])]),n("details",W,[e[3]||(e[3]=n("summary",null,[n("span",null,"first/mainwindow.cpp"),n("small",null,"236 B")],-1)),n("pre",null,[n("code",{textContent:i(r[2])},null,8,f)])]),n("details",M,[e[4]||(e[4]=n("summary",null,[n("span",null,"build-first-Desktop_Qt_5_14_2_MinGW_32_bit-Debug/ui_mainwindow.h"),n("small",null,"2.2 KB")],-1)),n("pre",null,[n("code",{textContent:i(r[3])},null,8,B)])]),n("details",A,[e[5]||(e[5]=n("summary",null,[n("span",null,"first/mainwindow.h"),n("small",null,"344 B")],-1)),n("pre",null,[n("code",{textContent:i(r[4])},null,8,C)])]),n("details",h,[e[6]||(e[6]=n("summary",null,[n("span",null,"first/first.pro"),n("small",null,"1021 B")],-1)),n("pre",null,[n("code",{textContent:i(r[5])},null,8,I)])])])])]))}});export{x as __pageData,S as default};
