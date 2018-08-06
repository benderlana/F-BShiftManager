sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";

    var PianiController = Controller.extend("myapp.controller.Piani", {
        data_json: {},
        ModelLinea: new JSONModel(),
        ModelTurni: new JSONModel(),
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        StabilimentoID: 1,
        paths: null,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        STOP: 0,
        TIMER: null,
        RefreshCounter: null,
        PDCParameters: null,
        BusyDialog: new sap.m.BusyDialog("GlobalBusyDialog"),

        onInit: function () {
            var oModel = new JSONModel({StabilimentoID: this.StabilimentoID});
            sap.ui.getCore().setModel(oModel, "stabilimento");
            sap.ui.getCore().setModel(this.ModelTurni, "turni");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("piani").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (oEvent) {
            this.getView().byId("piani").setBusy(false);
            this.BusyDialog.close();
            clearInterval(this.TIMER);
            this.RefreshCounter = 10;
            this.STOP = 0;
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            this.getView().setModel(this.ModelLinea, 'linea');
            this.RefreshCall();
            var that = this;
            this.TIMER = setInterval(function () {
                try {
                    that.RefreshCounter++;
                    if (that.STOP === 0 && that.RefreshCounter >= 10) {
                        that.RefreshFunction();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },
        RefreshFunction: function (msec) {
            this.RefreshCounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/pianidiconf_new.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllPianiDiConfezionamento&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.SUCCESSDatiTurni.bind(this));
        },
        SUCCESSDatiTurni: function (Jdata) {
            this.ModelTurni.setData(Library.RecursiveJSONTimeConversion(Jdata));
            this.getView().setModel(this.ModelTurni, "turni");
            sap.ui.getCore().setModel(this.ModelTurni, "turni");
            var oScroll = this.getView().byId("scrollTurniConclusi");
            this.setScrollHeight(oScroll);
            oScroll = this.getView().byId("scrollTurniProgrammati");
            this.setScrollHeight(oScroll);
            if (this.ISLOCAL !== 1 && this.STOP === 0) {
                this.RefreshCounter = 0;
            }
        },
        setScrollHeight: function (oScroll) {
            var items_num = this.ModelTurni.getProperty(oScroll.getContent()[0].getBindingInfo("items").path).length;
            switch (items_num) {
                case 0:
                    oScroll.setHeight("61.67px");
                    oScroll.removeStyleClass("scrollingbar");
                    oScroll.addStyleClass("scrollingbarTransparent");
                    break;
                case 1:
                    oScroll.setHeight("61.67px");
                    oScroll.removeStyleClass("scrollingbar");
                    oScroll.addStyleClass("scrollingbarTransparent");
                    break;
                case 2:
                    oScroll.setHeight("123.34px");
                    oScroll.removeStyleClass("scrollingbar");
                    oScroll.addStyleClass("scrollingbarTransparent");
                    break;
                case 3:
                    oScroll.setHeight("187px");
                    oScroll.removeStyleClass("scrollingbar");
                    oScroll.addStyleClass("scrollingbarTransparent");
                    break;
                default:
                    oScroll.setHeight("187px");
                    oScroll.addStyleClass("scrollingbar");
                    oScroll.removeStyleClass("scrollingbarTransparent");
            }
        },
        SwitcherTurni: function (oEvent) {
            this.BusyDialog.open();
            this.getView().byId("piani").setBusy(true);
            var oTable = oEvent.getSource().getParent().getBindingContext("turni");
            var Row = oTable.getModel().getProperty(oTable.sPath);
            var area = Row.area;
            this.paths = oEvent.getSource().getBindingContext("turni").getPath().substr(1).split("/");
            var pdcId = Row.PdcID;
            var link;
            var repartoId = this.ModelReparti.getData().ListaReparti[0].RepartoID;
            this.PDCParameters = {pdc: pdcId, stabilimento: this.StabilimentoID, reparto: repartoId};
            if (this.ISLOCAL === 1) {
                if (area === "0") {
                    link = "model/linee.json";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoChiuso.bind(this));
                } else {
                    link = "model/linee_prova.json";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoApertoInCorso.bind(this));
                }
            } else {
                if (area === "0") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoChiuso.bind(this));
                } else if (area === "1") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&IsRidotta=0&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoApertoInCorso.bind(this));
                } else if (area === "2") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&IsRidotta=0&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoApertoFuturo.bind(this));
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/InsertPdcManuale&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTurnoApertoFuturo.bind(this));
                }
            }
        },
        SUCCESSTurnoChiuso: function (Jdata) {
            clearInterval(this.TIMER);
            this.STOP = 1;
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            sap.ui.getCore().setModel(new JSONModel(this.PDCParameters), "ParametriPiano");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePianoGrey", {turnoPath: this.paths[1], pianoPath: this.paths[2]});
            this.ModelLinea.refresh(true);
        },
        SUCCESSTurnoApertoInCorso: function (Jdata) {
            clearInterval(this.TIMER);
            this.STOP = 1;
            for (var i = 0; i < Jdata.linee.length; i++) {
                if (Number(Jdata.linee[i].avanzamento) >= 100) {
                    Jdata.linee[i].avanzamento = 100;
                } else {
                    Jdata.linee[i].avanzamento = Number(Jdata.linee[i].avanzamento);
                }
            }
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            this.PDCParameters.pdc = Jdata.pdcId;
            sap.ui.getCore().setModel(new JSONModel(this.PDCParameters), "ParametriPiano");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePianoGreen", {turnoPath: this.paths[1], pianoPath: this.paths[2]});
            this.ModelLinea.refresh(true);
        },
        SUCCESSTurnoApertoFuturo: function (Jdata) {
            clearInterval(this.TIMER);
            this.STOP = 1;
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            this.PDCParameters.pdc = Jdata.pdcId;
            sap.ui.getCore().setModel(new JSONModel(this.PDCParameters), "ParametriPiano");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePianoYellow", {turnoPath: this.paths[1], pianoPath: this.paths[2]});
            this.ModelLinea.refresh(true);
        },
        BackToMain: function () {
            clearInterval(this.TIMER);
            this.STOP = 1;
            this.getOwnerComponent().getRouter().navTo("Main");
        }
    });
    return PianiController;
});