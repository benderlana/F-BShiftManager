sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/control/CustomButtonSin',
    'myapp/control/CustomVBoxSin',
    'myapp/controller/Library',
    'sap/m/MessageToast'
], function (jQuery, Controller, JSONModel, CustomButtonSin, CustomVBoxSin, Library, MessageToast) {
    "use strict";
    return Controller.extend("myapp.controller.OverviewLinea", {
        ModelSinottico: sap.ui.getCore().getModel("ModelSinottico"),
        ModelAllarmi: new JSONModel(),
        ModelParametri: new JSONModel(),
        AlarmSTOP: null,
        BusyDialog: new sap.m.BusyDialog(),
        AlarmTIMER: null,
        AlarmDialog: null,
        AlarmCounter: null,
        macchinaId: null,
        macchina: null,
        STOP: null,
        TIMER: null,
        Counter: null,
        packedBoxes: null,
        discard1: null,
        discard2: null,
//  FUNZIONI D'INIZIALIZZAZIONE      
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("OverviewLinea").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
            this.packedBoxes = 10;
            this.discard1 = 5;
            this.discard2 = 18;

            var i, j, tab;
//            var button;
            var hbox, vb1, vb2, vbox1, vbox2, t1, t2, f1, f2;
            var Jdata = this.ModelSinottico.getData();
            for (i = 0; i < Jdata.length; i++) {
                Jdata[i].IMG = Jdata[i].Descrizione.toLowerCase().split(" ").join("_") + "I.png";
                for (j = 0; j < Jdata[i].Macchine.length; j++) {
                    Jdata[i].Macchine[j].class = Jdata[i].Macchine[j].nome.split(" ").join("");
                    Jdata[i].Macchine[j].t1 = this.SetText(this.ModelSinottico.getData()[i].Macchine[j].nome, 1);
                    Jdata[i].Macchine[j].t2 = this.SetText(this.ModelSinottico.getData()[i].Macchine[j].nome, 2);
                    Jdata[i].Macchine[j].stato = this.getRandom();
                }
            }
            clearInterval(this.TIMER);
            this.STOP = 0;
            this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            var TabContainer = this.getView().byId("schemaLineeContainer");
            for (i = 0; i < TabContainer.getItems().length; i++) {
                tab = TabContainer.getItems()[i];
                for (j = 0; j < this.ModelSinottico.getData()[i].Macchine.length; j++) {
                    hbox = new sap.m.HBox({height: "15%", width: "15%", id: this.ModelSinottico.getData()[i].Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID});
                    vbox1 = new CustomVBoxSin({height: "100%", width: "25%", stato: "{ModelSinottico>/" + i + "/Macchine/" + j + "/stato}"});
                    vbox2 = new sap.m.VBox({height: "100%", width: "75%"});
                    vb1 = new sap.m.VBox({height: "50%", width: "100%"});
                    vb2 = new sap.m.VBox({height: "50%", width: "100%"});
                    vbox1.addStyleClass("bordoBluSin");
                    vbox2.addStyleClass("bordoBluSinT");
                    vbox2.addStyleClass("bordoBluSinB");
                    vbox2.addStyleClass("bordoBluSinR");
                    vb1.addStyleClass("bordoBluSinB");
                    t1 = new sap.m.Text({text: "{ModelSinottico>/" + i + "/Macchine/" + j + "/t1}"});
                    t2 = new sap.m.Text({text: "{ModelSinottico>/" + i + "/Macchine/" + j + "/t2}"});
                    t1.addStyleClass("textSin");
                    t2.addStyleClass("textSin");
                    f1 = new sap.m.FlexBox({width: "100%", height: "100%", alignContent: "Center", alignItems: "Center", justifyContent: "Center"});
                    f2 = new sap.m.FlexBox({width: "100%", height: "100%", alignContent: "Center", alignItems: "Center", justifyContent: "Center"});
                    f1.addItem(t1);
                    f2.addItem(t2);
                    vb1.addItem(f1);
                    vb2.addItem(f2);
                    vbox2.addItem(vb1);
                    vbox2.addItem(vb2);
                    hbox.addItem(vbox1);
                    hbox.addItem(vbox2);
                    hbox.addStyleClass(this.ModelSinottico.getData()[i].Macchine[j].class);
                    tab.addContent(hbox);
//                        button = new CustomButtonSin({
//                            id: this.ModelSinottico.getData()[i].Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID,
//                            text: "{ModelSinottico>/" + i + "/Macchine/" + j + "/nome}",
//                            stato: "{ModelSinottico>/" + i + "/Macchine/" + j + "/stato}",
//                            press: [this.ShowParameters, this]});
//                        button.addStyleClass("buttonSinottico");
//                        button.addStyleClass(this.ModelSinottico.getData()[i].Macchine[j].class);
//                        tab.addContent(button);
                }
            }
            for (i = 0; i < TabContainer.getItems().length; i++) {
                if (this.ModelSinottico.getData()[i].IsSelected === "1") {
                    tab = TabContainer.getItems()[i];
                }
            }
            TabContainer.setSelectedItem(tab);
            Library.RemoveClosingButtons.bind(this)("schemaLineeContainer");
            this.Counter = 10;
            var that = this;
            this.TIMER = setInterval(function () {
                try {
                    that.Counter++;
                    if (that.STOP === 0 && that.Counter >= 10) {
                        that.RefreshFunction();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },

        //  FUNZIONI DI REFRESH
        RefreshFunction: function (msec) {
            setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
//            var link;
//            if (this.ISLOCAL !== 1) {
//                link = "/XMII/Runner?Transaction=DeCecco/Transactions/Sinottico/SinotticoLineeGood&Content-Type=text/json&OutputParameter=JSON";
//            }
//            Library.AjaxCallerData(link, this.RefreshModelSinottico.bind(this));
            this.RefreshModelSinottico();
        },
        RefreshModelSinottico: function (Jdata) {
            Jdata = this.ModelSinottico.getData();
            var i, j;
            if (this.STOP === 0) {
                this.Counter = 0;
                for (i = 0; i < Jdata.length; i++) {
//                    Jdata[i].IMG = Jdata[i].Descrizione.toLowerCase().split(" ").join("_") + ".png";
                    for (j = 0; j < Jdata[i].Macchine.length; j++) {
//                        Jdata[i].Macchine[j].class = Jdata[i].Macchine[j].nome.split(" ").join("");
                        Jdata[i].Macchine[j].stato = this.getRandom();
                        Jdata[i].Macchine[j].t1 = this.SetText(this.ModelSinottico.getData()[i].Macchine[j].nome, 1);
                        Jdata[i].Macchine[j].t2 = this.SetText(this.ModelSinottico.getData()[i].Macchine[j].nome, 2);
                    }
                }
                this.ModelSinottico.setData(Jdata);
                this.ModelSinottico.refresh(true);
                this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            }
        },
        SetText: function (machine, ind) {
            var res;
            switch (machine) {
                case "Marker 1":
                case "Marker 2":
                    var date = new Date();
                    res = (ind === 1) ? "Lot Number: 123456" : "Expires: " + date.getDate() + "/" + Number(Number(date.getMonth()) + 1) + "/" + Number(1903 + Number(date.getYear()));
                    return res;
                case "Palletizer":
                    this.packedBoxes += 1;
                    res = (ind === 1) ? "Packages per Box: 24" : "Boxes Counter: " + this.packedBoxes;
                    return res;
                case "Labeller":
                    res = (ind === 1) ? "Label Size: 9x5cm" : "Customer: Techedge F&B";
                    return res;
                default:
                    res = (ind === 1) ? "Live Measure: " + this.RandomNormal() + "gr" : "Discarded: " + this.GetDiscard(machine);
                    return res;
            }
        },
        getRandom: function () {
            var val = Math.floor(3 * Math.random());
            switch (val) {
                case 0:
                    return "Good";
                case 1:
                    return "Warning";
                default:
                    return "Error";
            }
        },
        RandomNormal: function () {
            var mean = (this.ModelSinottico.getData().length === 1) ? 1902 : 502;
            var std = 0.005 * mean;
            var iter = 10;
            var A = mean - std * Math.sqrt(3 * iter);
            var B = 2 * std * Math.sqrt(3 / iter);
            var res = 0;
            for (var i = 0; i < iter; i++) {
                res += Math.random();
            }
            return Math.round((A + (B * res)) * 100) / 100;
        },
        GetDiscard: function (mac) {
            if (Math.random() <= 0.2) {
                this.discard1 += 1;
                this.discard2 += 1;
            }
            if (mac.indexOf("1") > -1) {
                return this.discard1;
            } else {
                return this.discard2;
            }
        },
        BackToRiepilogo: function () {
            var i, j, hbox;
            var TabContainer = this.getView().byId("schemaLineeContainer");
            for (i = 0; i < TabContainer.getItems().length; i++) {
                for (j = 0; j < this.ModelSinottico.getData()[i].Macchine.length; j++) {
                    hbox = sap.ui.getCore().byId(this.ModelSinottico.getData()[i].Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID);
                    if (hbox) {
                        hbox.destroy();
                    }
                }
            }
            clearInterval(this.TIMER);
            this.BusyDialog.open();
            this.STOP = 1;
            this.getOwnerComponent().getRouter().navTo("RiepilogoLinee");
            this.BusyDialog.close();
        }
    });
});