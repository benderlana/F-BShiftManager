sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/control/CustomButtonSin',
    'myapp/controller/Library',
    'sap/m/MessageToast'
], function (jQuery, Controller, JSONModel, CustomButtonSin, Library, MessageToast) {
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
//  FUNZIONI D'INIZIALIZZAZIONE      
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("OverviewLinea").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
            var i, j, tab, button;
            var Jdata = this.ModelSinottico.getData();
            for (i = 0; i < Jdata.length; i++) {
                Jdata[i].IMG = Jdata[i].Descrizione.toLowerCase().split(" ").join("_") + ".png";
                for (j = 0; j < Jdata[i].Macchine.length; j++) {
                    Jdata[i].Macchine[j].class = Jdata[i].Macchine[j].nome.split(" ").join("");
                }
            }
            clearInterval(this.TIMER);
            this.STOP = 0;
            this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            var TabContainer = this.getView().byId("schemaLineeContainer");
            for (i = 0; i < TabContainer.getItems().length; i++) {
                tab = TabContainer.getItems()[i];
                if (!sap.ui.getCore().byId(this.ModelSinottico.getData()[i].Macchine[0].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID)) {
                    for (j = 0; j < this.ModelSinottico.getData()[i].Macchine.length; j++) {
                        button = new CustomButtonSin({
                            id: this.ModelSinottico.getData()[i].Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID,
                            text: "{ModelSinottico>/" + i + "/Macchine/" + j + "/nome}",
                            stato: "{ModelSinottico>/" + i + "/Macchine/" + j + "/stato}",
                            press: [this.ShowParameters, this]});
                        button.addStyleClass("buttonSinottico");
                        button.addStyleClass(this.ModelSinottico.getData()[i].Macchine[j].class);
                        tab.addContent(button);
                    }
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
            this.TIMER = setTimeout(this.RefreshCall.bind(this), msec);
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
                    Jdata[i].IMG = Jdata[i].Descrizione.toLowerCase().split(" ").join("_") + ".png";
                    for (j = 0; j < Jdata[i].Macchine.length; j++) {
                        Jdata[i].Macchine[j].class = Jdata[i].Macchine[j].nome.split(" ").join("");
                        Jdata[i].Macchine[j].stato = this.getRandom();
                    }
                }
                this.ModelSinottico.setData(Jdata);
                this.ModelSinottico.refresh(true);
                this.getView().setModel(this.ModelSinottico, "ModelSinottico");
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
        BackToRiepilogo: function () {
            var i, j, button;
            var TabContainer = this.getView().byId("schemaLineeContainer");
            for (i = 0; i < TabContainer.getItems().length; i++) {
                for (j = 0; j < this.ModelSinottico.getData()[i].Macchine.length; j++) {
                    button = sap.ui.getCore().byId(this.ModelSinottico.getData()[i].Macchine[j].nome.split(" ").join("") + "_" + this.ModelSinottico.getData()[i].LineaID);
                    if (button) {
                        button.destroy();
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