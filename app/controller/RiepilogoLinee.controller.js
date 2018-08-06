sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";
    return Controller.extend("myapp.controller.RiepilogoLinee", {
        ModelLinee: new JSONModel(),
        ModelElencoLinee: new JSONModel(),
        ModelSinotticoLinea: new JSONModel(),
        STOP: null,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
//  FUNZIONI D'INIZIALIZZAZIONE        
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RiepilogoLinee").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function () {
            this.STOP = 0;
            this.ModelLinee = sap.ui.getCore().getModel("linee");
            this.getView().setModel(this.ModelLinee, "linee");
            this.LineButtonStyle("PastaCorta");
            this.LineButtonStyle("PastaLunga");
            this.BarColorCT(this.ModelLinee.getData(), "PastaLunga");
            this.BarColorCT(this.ModelLinee.getData(), "PastaCorta");
            this.RefreshFunction(10000);
        },
//  FUNZIONI DI REFRESH
        RefreshFunction: function (msec) {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/linee_riepilogo.json";
            } else {

            }
            Library.SyncAjaxCallerData(link, this.RefreshModelLinee.bind(this));
        },
        RefreshModelLinee: function (Jdata) {
            if (this.STOP === 0) {
                this.ModelLinee.setData(Jdata);
                this.ModelLinee.refresh(true);
                this.getView().setModel(this.ModelLinee, "linee");
                this.LineButtonStyle("PastaCorta");
                this.LineButtonStyle("PastaLunga");
                this.BarColorCT(this.ModelLinee.getData(), "PastaLunga");
                this.BarColorCT(this.ModelLinee.getData(), "PastaCorta");
                this.RefreshFunction(10000);
            }
        },

//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> FUNZIONI CHIAMATE AL CLICK <<<<<<<<
//        
//        ************************ INTESTAZIONE ************************
//              
        GoToHome: function () {
            this.STOP = 1;
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("main", true);
        },
//        ************************ BOTTONE DI LINEA ************************        
        GoToSinotticoLinea: function (oEvent) {
            this.STOP = 1;
            var oLinea = oEvent.getSource().getBindingContext("linee").sPath;
            var lineaID = this.getView().getModel("linee").getProperty(oLinea).lineaID;
            var oModel = new JSONModel({lineaID: lineaID});
            sap.ui.getCore().setModel(oModel, "LineaCliccata");
            Library.AjaxCallerData("model/elencolinee.json", this.SUCCESSElencoLinee.bind(this));
            sap.ui.getCore().setModel(this.ModelElencoLinee, "elencolinee");
            Library.AjaxCallerData("model/sinotticodilinea.json", this.SUCCESSLineaSinottico.bind(this));
            sap.ui.getCore().setModel(this.ModelSinotticoLinea, "sinotticodilinea");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("sinotticoLinea");
        },
        SUCCESSElencoLinee: function (Jdata) {
            this.ModelElencoLinee.setData(Jdata);
        },
        SUCCESSLineaSinottico: function (Jdata) {
            this.ModelSinotticoLinea.setData(Jdata);
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> GESTIONE STILE <<<<<<<<
//  
//        ************************ GESTIONE STILE PULSANTE DI LINEA ************************    
        LineButtonStyle: function (nome_table) {
            var classes = ["LineaDispo", "LineaNonDispo", "LineaVuota", "LineaAttrezzaggio", "LineaLavorazione", "LineaFermo", "LineaSvuotamento"];
            var data = this.ModelLinee.getData();
            var button;
            var state;
            for (var i = 0; i < data.linee[nome_table].length; i++) {
                button = this.getView().byId(nome_table).getItems()[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0];
                for (var k = 0; k < classes.length; k++) {
                    button.removeStyleClass(classes[k]);
                }
                state = data.linee[nome_table][i].statolinea.split(".");
                switch (state[0]) {
                    case "Disponibile":
                        button.addStyleClass("LineaDispo");
                        break;
                    case "Nondisponibile":
                        button.addStyleClass("LineaNonDispo");
                        break;
                }
                switch (state[1]) {
                    case "Vuota":
                        button.addStyleClass("LineaVuota");
                        break;
                    case "Attrezzaggio":
                        button.addStyleClass("LineaAttrezzaggio");
                        break;
                    case "Lavorazione":
                        button.addStyleClass("LineaLavorazione");
                        break;
                    case "Fermo":
                        button.addStyleClass("LineaFermo");
                        break;
                    case "Svuotamento":
                        button.addStyleClass("LineaSvuotamento");
                        break;
                }
            }
        },
//        ************************ GESTIONE STILE PROGRESS INDICATOR ************************     
        BarColorCT: function (data, nome_table) {
            var progressBar;
            if (data.linee[nome_table].length > 0) {
                for (var i = 0; i < data.linee[nome_table].length; i++) {
                    if (Number(data.linee[nome_table][i].avanzamento) >= 100) {
                        data.linee[nome_table][i].avanzamento = 100;
                    } else {
                        data.linee[nome_table][i].avanzamento = Number(data.linee[nome_table][i].avanzamento);
                    }
                    progressBar = this.getView().byId(nome_table).getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0];
                    switch (data.linee[nome_table][i].barColor) {
                        case "yellow":
                            progressBar.setState("Warning");
                            break;
                        case "green":
                            progressBar.setState("Success");
                            break;
                        case "orange":
                            progressBar.setState("Error");
                            break;
                    }
                    if (data.linee[nome_table][i].statolinea === "Disponibile.Fermo") {
                        progressBar.setState("None");
                    }
                }
            }
            return data;
        }

    });
});


