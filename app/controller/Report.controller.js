sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library',
    'myapp/control/HierarchyTable'
], function (Controller, JSONModel, Library, HierarchyTable) {
    "use strict";
    return Controller.extend("myapp.controller.Report", {
        ISLOCAL: Number(sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL),
        ModelTurni: sap.ui.getCore().getModel("turni"),
        ModelOEE: sap.ui.getCore().getModel("ReportOEE"),
        ModelGuasti: new JSONModel({}),
        ModelLinea: new JSONModel({}),
        minValues: [],
        guasti: {},
        piano: null,
        pianoPath: null,
        turnoPath: null,
        GlobalBusyDialog: new sap.m.BusyDialog(),
        StabilimentoID: null,
        pdcID: null,
        repartoID: null,
        rowHTML: null,
        onInit: function () {
            this.getView().byId("ComponentiOEE").setHeaderSpan([3, 1, 1]);
            this.getView().byId("ComponentiPerdita").setHeaderSpan([9, 3, 1]);
            this.getView().byId("ComponentiProduttivita").setHeaderSpan([9, 3, 1]);
            this.getView().byId("ComponentiQualita").setHeaderSpan([9, 3, 1]);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("Report").attachPatternMatched(this._onObjectMatched, this);
        },
        FillOEETable: function () {
            var Jdata = this.ModelOEE.getData();
            var bck = this.RecursivePropertyAdder(Jdata, "hierarchy", 0);
            var data_new = bck;
            data_new = this.setWorstValues(data_new, "OEE");
            data_new = this.setWorstValues(data_new, "Ar");
            data_new = this.setWorstValues(data_new, "Pr");
            data_new = this.setWorstValues(data_new, "Qr");
            data_new = this.setHighestValues(data_new, "AlSetup");
            data_new = this.setHighestValues(data_new, "AlFermo");
            data_new = this.setHighestValues(data_new, "PlVelocita");
            data_new = this.setHighestValues(data_new, "PlMicrofermate");
            data_new = this.setHighestValues(data_new, "QlScartiSetup");
            data_new = this.setHighestValues(data_new, "QlScartiProduzione");
            this.ModelOEE.setData(data_new);
            this.getView().setModel(this.ModelOEE, "ReportOEE");
            sap.ui.getCore().setModel(this.ModelOEE, "ReportOEE");
            var that = this;
            setTimeout(function () {
                that.getView().byId("TreeTableReport").onAfterRendering();
                that.GlobalBusyDialog.close();
            }, 1000);
        },
        _onObjectMatched: function (oEvent) {
            this.StabilimentoID = sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID;
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").getData().pdc;
            this.repartoID = sap.ui.getCore().getModel("ParametriPiano").getData().reparto;
            this.GlobalBusyDialog.open();
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            var oTitle = this.getView().byId("ReportTitle");
            this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            oTitle.setText(this.piano.data + "    -    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
            this.FillOEETable();
        },
        RecursivePropertyAdder: function (bck, prop_name, i) {
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    if (typeof bck.length === "undefined") {
                        bck[key] = this.RecursivePropertyAdder(bck[key], prop_name, i + 1);
                    } else {
                        bck[key] = this.RecursivePropertyAdder(bck[key], prop_name, i);
                    }
                }
            }
            if (typeof bck.length === "undefined") {
                bck[prop_name] = i;
            }
            return bck;
        },
//ricambio i colori delle righe quando faccio il collapse o espando la treetable   (richiama la funziona impostata all'inizio nella mia custom table)         
        onToggleOpenState: function () {
            var oTable = this.getView().byId("TreeTableReport");
            var num = oTable.getRows().length;
            for (var i = 0; i < num; i++) {
                var rowhtml = jQuery.sap.byId(oTable.getRows()[i].getId())[0];
                if (rowhtml.classList.contains("Background0")) {
                    rowhtml.classList.remove("Background0");
                }
                if (rowhtml.classList.contains("Background1")) {
                    rowhtml.classList.remove("Background1");
                }
                if (rowhtml.classList.contains("Background2")) {
                    rowhtml.classList.remove("Background2");
                }
            }
            setTimeout(function () {
                num = oTable.getBinding("rows").getLength();
                for (var i = 0; i < num; i++) {
                    var row = oTable.getBinding("rows").getContextByIndex(i).getObject();
                    var rowhtml = jQuery.sap.byId(oTable.getRows()[i].getId());
                    switch (row.hierarchy) {
                        case 0:
                            rowhtml.addClass("Background0");
                            break;
                        case 1:
                            rowhtml.addClass("Background1");
                            break;
                        case 2:
                            rowhtml.addClass("Background2");
                            break;
                        default:
                            break;
                    }

                }
            }, 0);
        },
//RICERCO I 3 VALORI PIU' BASSI (O PIU' ALTI) DI OGNI COLONNA E SETTO LA PROPRIETA' RED CHE MI SERVE PER QUANDO RICHIAMO IL CONTROLLO CUSTOM TEXTHIERARCHYTABLE
        setWorstValues: function (bck, property) {
            var data_new = bck;
            this.minValues = [];
            this.takeAllElements(bck, property);
            this.minValues.sort(function (a, b) {
                return a - b;
            });
            data_new = this.setJSONWorstValues(bck, property, this.minValues[0], this.minValues[1], this.minValues[2]);
            return data_new;
        },
        setHighestValues: function (bck, property) {
            var data_new = bck;
            this.minValues = [];
            this.takeAllElements(bck, property);
            this.minValues.sort(function (a, b) {
                return b - a;
            });
            data_new = this.setJSONWorstValues(bck, property, this.minValues[0], this.minValues[1], this.minValues[2]);
            return data_new;
        },
        takeAllElements: function (bck, property) {
            var numero;
            for (var key in bck) {
                if (typeof bck[key] === "object" && key !== "red") {
                    bck[key] = this.takeAllElements(bck[key], property);
                }
            }
            if (bck.hierarchy === 3) {
                if (bck[property].endsWith("%")) {
                    numero = parseInt(bck[property].slice(0, 2), 10);
                } else {
                    numero = parseInt(bck[property], 10);
                }
                this.minValues.push(numero);
            }
            return bck;
        },
        setJSONWorstValues: function (bck, property, a, b, c) {
            var numero;
            for (var key in bck) {
                if (typeof bck[key] === "object" && key !== "red") {
                    bck[key] = this.setJSONWorstValues(bck[key], property, a, b, c);
                }
            }
            if (!bck.length) {
                if (!bck.red) {
                    bck.red = {};
                }
                bck.red[property] = false;
            }
            if (bck.hierarchy === 3) {
                if (bck[property].endsWith("%")) {
                    numero = parseInt(bck[property].slice(0, 2), 10);
                } else {
                    numero = parseInt(bck[property], 10);
                }
                if (numero === a || numero === b || numero === c) {
                    bck.red[property] = true;
                }
            }
            return bck;
        },
//DEFINISCO L'EVENTO PER QUANDO CLICCO SU DETERMINATE CELLE (QUELLE DELLE COLONNE DEL GRUPPO DISPONIBILITA')

        LinkClick: function (event) {
            if (typeof event.getParameters().rowBindingContext !== "undefined") {
                var clicked_row = event.getParameters().rowBindingContext.getObject();
                var index_column = parseInt(event.getParameters().columnIndex, 10);
                var index_row = parseInt(event.getParameters().rowIndex, 10);
                var batchId = clicked_row.BatchID;
                sap.ui.getCore().setModel({batchID: batchId}, "batchID");
                if (clicked_row.hierarchy === 3 && (index_column === 5 || index_column === 6 || index_column === 7)) {
                    for (var i = index_row - 1; i >= 0; i--) {
                        this.rowHTML = event.getSource().getRows()[i];
                        if (this.rowHTML._bHasChildren) {
                            break;
                        }
                    }
                    var link;
                    if (this.ISLOCAL === 1) {
                        link = "model/guasti_linee.json";
                    } else {
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiFromBatchID&Content-Type=text/json&BatchID=" + batchId + "&OutputParameter=JSON";
                    }
                    Library.AjaxCallerData(link, this.SUCCESSGuasti.bind(this));
                }
            }
        },
        SUCCESSGuasti: function (Jdata) {
            if (this.ISLOCAL === 1) {
//                for (var i = 0; i < Jdata.guasti.length; i++) {
//                    if (Jdata.fermi[i].nome === this.rowHTML.getCells()[0].getText()) {
//                        this.guasti = Jdata.fermi[i];
//                        break;
//                    }
//                }
                this.guasti = Library.AddTimeGaps(Jdata);
                this.ModelGuasti.setData(this.guasti);
            } else {
                this.guasti = Jdata;
                this.guasti = Library.AddTimeGaps(this.guasti);
                this.ModelGuasti.setData(this.guasti);
            }
            sap.ui.getCore().setModel(this.ModelGuasti, "guasti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("guastidilinea",
                    {
                        turnoPath: this.turnoPath,
                        pianoPath: this.pianoPath,
                        guastiPath: this.rowHTML.getCells()[0].getText()
                    });
        },
        onBackNav: function () {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            Library.AjaxCallerData(link, this.SUCCESSTurnoChiuso.bind(this));
        },
        SUCCESSTurnoChiuso: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("managePianoGrey", {turnoPath: this.turnoPath, pianoPath: this.pianoPath});
            this.ModelLinea.refresh(true);
        }
    });
});