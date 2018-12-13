sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";
    return Controller.extend("myapp.controller.RiepilogoLinee", {
        ModelLinee: new JSONModel(),
        ModelSinottico: new JSONModel(),
        STOP: null,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        BusyDialog: new sap.m.BusyDialog(),
        CHECKFIRSTTIME: 0,
        StabilimentoID: 1,
        RepartoID: 1,
        TIMER: null,
        SPCDialog: null,
        STOPSPC: null,
        SPCCounter: null,
        ModelSPCData: new JSONModel({}),
        ModelBarData: new JSONModel({}),
        ModelPieData: new JSONModel({}),
        ModelCausesBarData: new JSONModel({}),
        indexSPC: null,
        IDSelected: null,
        batchID: null,
        buttonPressed: new JSONModel({}),
//  FUNZIONI D'INIZIALIZZAZIONE      
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RiepilogoLinee").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
            this.getView().byId("RiepilogoLineePage").setBusy(false);
            clearInterval(this.TIMER);
            this.RefreshCounter = 10;
            this.STOP = 0;
            this.ModelLinee = sap.ui.getCore().getModel("linee");
            this.getView().setModel(this.ModelLinee, "linee");
//            this.RefreshFunction(100);
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
//  FUNZIONI DI REFRESH
        RefreshFunction: function (msec) {
            setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/linee_riepilogo.json";
            } else {
//                link = "model/JSON_RiepilogoLinee";
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoSinottico&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.RefreshModelLinee.bind(this));
        },
        RefreshModelLinee: function (Jdata) {
            if (this.STOP === 0) {
                this.RefreshCounter = 0;
                for (var i = 0; i < Jdata.length; i++) {
                    for (var j = 0; j < Jdata[i].Linee.length; j++) {
                        Jdata[i].Linee[j].SPC = Jdata[i].Linee[j].SPC.reverse();
                        Jdata[i].Linee[j].avanzamento = (Number(Jdata[i].Linee[j].avanzamento) >= 100) ? 100 : Number(Jdata[i].Linee[j].avanzamento);
                        Jdata[i].Linee[j].perc_avanzamento = String(Math.round(Number(Jdata[i].Linee[j].avanzamento)));
                        Jdata[i].Linee[j].destinazione = (Jdata[i].Linee[j].destinazione === "---") ? "" : Jdata[i].Linee[j].destinazione;
                        Jdata[i].Linee[j].IMG = String(Number(Jdata[i].Linee[j].formato.replace(/\D/g, ""))) + ".jpg";
                        Jdata[i].Linee[j].cartoniProdotti = String(Math.round(Number(Jdata[i].Linee[j].cartoniProdotti)));
                        Jdata[i].Linee[j].cartoniResidui = String(Math.round(Number(Jdata[i].Linee[j].cartoniResidui)));
                        Jdata[i].Linee[j].disponibilita = String(Math.round(Number(Jdata[i].Linee[j].disponibilita.slice(0, Jdata[i].Linee[j].disponibilita.length - 1))));
                        Jdata[i].Linee[j].efficienza = String(Math.round(Number(Jdata[i].Linee[j].efficienza.slice(0, Jdata[i].Linee[j].efficienza.length - 1))));
                    }
                }
                this.ModelLinee.setData(Jdata);
                this.ModelLinee.refresh(true);
                this.getView().setModel(this.ModelLinee, "linee");
                sap.ui.getCore().setModel(this.ModelLinee, "linee");
                Library.RemoveClosingButtons.bind(this)("schemaLineeContainer");
                this.BarColorCT(this.ModelLinee.getData());
            }
        },
        GoToSinottico: function (event) {
//            this.getView().byId("RiepilogoLineePage").setBusy(true);
            this.BusyDialog.open();
            this.ModelSinottico.setData(this.BuildModelSinottico(event));
            sap.ui.getCore().setModel(this.ModelSinottico, "ModelSinottico");
            this.getView().setModel(this.ModelSinottico, "ModelSinottico");
//            var path = event.getSource().getBindingContext("linee").getPath();
//            this.IDSelected = this.ModelLinee.getProperty(path).lineaID;
//            var link;
//            if (this.ISLOCAL !== 1) {
//                link = "/XMII/Runner?Transaction=DeCecco/Transactions/Sinottico/SinotticoLineeGood&Content-Type=text/json&OutputParameter=JSON";
//            }
            this.BusyDialog.close();
            this.getOwnerComponent().getRouter().navTo("OverviewLinea");
//            Library.AjaxCallerData(link, this.SUCCESSGoToSinottico.bind(this));
        },
        BuildModelSinottico: function (event) {
            var names = ["Marker 1", "Marker 2", "Weight Controller 1", "Weight Controller 2", "Labeller", "Palletizer"];
            var repartoPath = "/" + event.getSource().getBindingContext("linee").getPath().split("/")[1];
            var obj = [];
            var temp, i, j;
            var data = this.ModelLinee.getProperty(repartoPath).Linee;
            for (i = 0; i < data.length; i++) {
                temp = {};
                temp.LineaID = data[i].lineaID;
                temp.Descrizione = data[i].linea;
                temp.Macchine = [];
                for (j = 0; j < names.length; j++) {
                    temp.Macchine.push({"nome": names[j]});
                }
                obj.push(temp);
            }
            return obj;
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
        //         -> PULSANTI SPC CON REFRESH
        SPCGraph: function (event) {
            clearInterval(this.TIMER);
            this.STOP = 1;
            var obj = {};
            obj.path = event.getSource().getBindingContext("linee").sPath;
            obj.index = Number(event.getSource().data("mydata"));
            obj.view = "RiepilogoLinee";
            this.buttonPressed.setData(obj);
            sap.ui.getCore().setModel(this.buttonPressed, "buttonPressed");
            sap.ui.getCore().setModel(this.ModelLinee, "ModelLinee");
            this.getOwnerComponent().getRouter().navTo("LiveStats");
        },
//        ************************ GESTIONE STILE PROGRESS INDICATOR ************************     
        BarColorCT: function (data) {
            for (var j = 0; j < data.length; j++) {
                if (data[j].length > 0) {
                    for (var i = 0; i < data[j].length; i++) {
                        if (Number(data[j].Linee[i].avanzamento) >= 100) {
                            data[j].Linee[i].avanzamento = 100;
                        } else {
                            data[j].Linee[i].avanzamento = Number(data[j].Linee[i].avanzamento);
                        }
                    }
                }
            }
            return data;
        },
        BackToMain: function () {
            clearInterval(this.TIMER);
            this.getView().byId("RiepilogoLineePage").setBusy(true);
            this.BusyDialog.open();
            this.STOP = 1;
            this.getOwnerComponent().getRouter().navTo("Main");
            this.BusyDialog.close();
        }
    });
});