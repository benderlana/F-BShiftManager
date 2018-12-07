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
            clearInterval(this.TIMER);
            this.STOP = 0;
            var i, j, tab, button;
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
            var link;
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/Sinottico/SinotticoLineeGood&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.RefreshModelSinottico.bind(this));
        },
        RefreshModelSinottico: function (Jdata) {
            var i, j;
            if (this.STOP === 0) {
                this.Counter = 0;
                for (i = 0; i < Jdata.length; i++) {
                    Jdata[i].IMG = Jdata[i].Descrizione.toLowerCase().split(" ").join("_") + ".png";
                    Jdata[i].IsSelected = (Jdata[i].LineaID === this.IDSelected) ? "1" : "0";
                    this.SetNameMacchine(Jdata[i]);
                    for (j = 0; j < Jdata[i].Macchine.length; j++) {
                        Jdata[i].Macchine[j].class = Jdata[i].Macchine[j].nome.split(" ").join("");
                    }
                }
                this.ModelSinottico.setData(Jdata);
                this.ModelSinottico.refresh(true);
                this.getView().setModel(this.ModelSinottico, "ModelSinottico");
            }
        },
        SetNameMacchine: function (data_linea) {
            var names = ["marcatore", "etichettatrice", "controllo peso", "scatolatrice"];
            for (var i = 0; i < data_linea.Macchine.length; i++) {
                for (var j = 0; j < names.length; j++) {
                    if (data_linea.Macchine[i].nome.toLowerCase().indexOf(names[j]) > -1) {
                        switch (names[j]) {
                            case "marcatore":
                                data_linea.Macchine[i].nome = (data_linea.Macchine[i].nome.indexOf("SX") > -1) ? "Marcatore SX" : "Marcatore DX";
                                break;
                            case "controllo peso":
                                data_linea.Macchine[i].nome = (data_linea.Macchine[i].nome.indexOf("SX") > -1) ? "PackItal SX" : "PackItal DX";
                                break;
                            case "etichettatrice":
                                data_linea.Macchine[i].nome = "Etichettatrice";
                                break;
                            case "scatolatrice":
                                data_linea.Macchine[i].nome = "Scatolatrice";
                                break;
                        }
                    }
                }
            }
        },
        getRandom: function () {
            var val = Math.floor(4 * Math.random());
            switch (val) {
                case 0:
                    return "9";
                case 1:
                    return "10";
                case 2:
                    return "13";
                default:
                    return "32";
            }
        },
        BackToRiepilogo: function () {
            clearInterval(this.TIMER);
            this.BusyDialog.open();
            this.STOP = 1;
            this.getOwnerComponent().getRouter().navTo("RiepilogoLinee");
            this.BusyDialog.close();
        }
    });
});