sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/control/CustomButt',
    'myapp/controller/Library',
    'myapp/model/TimeFormatter'
], function (MessageToast, jQuery, Controller, JSONModel, History, CustomButt, Library, TimeFormatter) {
    "       use strict";
    var ManagePiano = Controller.extend("myapp.controller.ManagePiano", {
        AddButtonObject: {
            batchID: "#ADD#",
            sequenza: "#ADD#",
            statoBatch: "#ADD#",
            erroreBatch: "#ADD#",
            formatoProduttivo: "#ADD#",
            confezione: "#ADD#",
            grammatura: "#ADD#",
            destinazione: "#ADD#",
            qli: "#ADD#",
            cartoni: "#ADD#",
            ore: "#ADD#",
            disponibilita: "#ADD#",
            produttivita: "#ADD#",
            qualita: "#ADD#",
            fermo: "#ADD#",
            pezziCartone: "#ADD#",
            secondiPerPezzo: "#ADD#"},
        StabilimentoID: null,
        pdcID: null,
        repartoID: null,
        linea_id: null,
        row: null,
        linea: null,
        pezzi_cartone: 24, //ARRIVA DA BACKEND 
        tempo_ciclo: 4, //ARRIVA DA BACKEND
        TimeFormatter: TimeFormatter,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        data_json: {},
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        ModelMenu: new JSONModel({}),
        ModelLinea: null,
        ModelOperatori: new JSONModel({}),
        ModelSKU: new JSONModel({}),
        ModelTurni: null,
        ModelSKUstd: new JSONModel({}),
        ModelCause: new JSONModel({}),
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
        STOP: 0,
        oButton: null,

        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePiano").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (oEvent) {
            this.StabilimentoID = sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID;
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").pdc;
            this.repartoID = sap.ui.getCore().getModel("ParametriPiano").reparto;
            this.ModelLinea = sap.ui.getCore().getModel("linee");
            this.ModelTurni = sap.ui.getCore().getModel("turni");
            if (Number(this.ISLOCAL) === 1) {
                Library.AjaxCallerData("model/operators.json", this.SUCCESSDatiOperatore.bind(this));
                this.getView().setModel(this.ModelOperatori, 'operatore');
                Library.AjaxCallerData("model/SKU_standard.json", this.SUCCESSSKUstd.bind(this));
                this.getView().setModel(this.ModelSKUstd, 'SKUstd');
                Library.AjaxCallerData("model/SKU_backend.json", this.SUCCESSSKU.bind(this));
                this.getView().setModel(this.ModelSKU, 'SKU');
            }
            if (typeof oEvent !== "undefined") {
                this.STOP = 0;
                this.turnoPath = oEvent.getParameter("arguments").turnoPath;
                this.pianoPath = oEvent.getParameter("arguments").pianoPath;
                this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            }
            var oTitle = this.getView().byId("Title");
            oTitle.setText(this.piano.data + "    -    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
//            var data = this.ModelLinea.getData().linee;
//            for (var l = 0; l < data.length; l++) {
//                data[l].batchlist.push(this.AddButtonObject);
//            }
            this.getView().setModel(this.ModelLinea, 'linea');
            this.getView().byId("managePianoTable").getBinding("items").refresh();
            if (this.ISLOCAL !== 1 && this.STOP === 0) {
                this.RefreshFunction();
            }
//            this.getView().setModel(this.ModelLinea, 'linea');
//            this.getView().byId("managePianoTable").rerender();
//            this.addFieldsCreazione();
//            if (Number(this.piano.area) === 1) {
//                this.changeFields();
//            }
            this.manageSPCButton();
// MI SERVE PER LO STATO LINEA                
            var oModel = new JSONModel({inizio: this.piano.turno.split("-")[0].trim(), fine: this.piano.turno.split("-")[1].trim()});
            this.getView().setModel(oModel, "orarioturno");
        },
        RefreshFunction: function () {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), 5000);
        },
        RefreshCall: function () {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            Library.SyncAjaxCallerData(link, this.RefreshDataSet.bind(this));
        },
        RefreshDataSet: function (Jdata) {
            if (this.ISLOCAL === 1) {
                Library.AjaxCallerData("model/operators.json", this.SUCCESSDatiOperatore.bind(this));
                this.getView().setModel(this.ModelOperatori, 'operatore');
                Library.AjaxCallerData("model/SKU_standard.json", this.SUCCESSSKUstd.bind(this));
                this.getView().setModel(this.ModelSKUstd, 'SKUstd');
                Library.AjaxCallerData("model/SKU_backend.json", this.SUCCESSSKU.bind(this));
                this.getView().setModel(this.ModelSKU, 'SKU');
            } else {
                if (this.STOP === 0) {
//                    for (var l = 0; l < Jdata.linee.length; l++) {
//                        Jdata.linee[l].batchlist.push(this.AddButtonObject);
//                    }
                    this.ModelLinea.setData(Jdata);
                    this.getView().setModel(this.ModelLinea, "linea");
                    sap.ui.getCore().setModel(this.ModelLinea, "linee");
                }
            }
            this.URLChangeCheck();
        },
        SUCCESSCause: function (Jdata) {
            this.data_json = {};
            this.data_json.cause = [];
            this.takeAllCause(Jdata);
            this.ModelCause.setData(this.data_json);
        },
        SUCCESSDatiOperatore: function (Jdata) {
            this.ModelOperatori.setData(Jdata);
            this.getView().setModel(this.ModelOperatori, 'operatore');
        },
        SUCCESSSKU: function (Jdata) {
            var bck = Jdata.SKUattuale;
            var std = Jdata.SKUstandard;
//            var std = this.getView().getModel("SKUstd").getData();
            bck = Library.RecursiveJSONComparison(std, bck, "attributi");
            bck = Library.RecursiveParentExpansion(bck);
            this.ModelSKU.setData(bck);
            this.getView().setModel(this.ModelSKU, "SKU");
        },
        SUCCESSSKUstd: function (Jdata) {
            this.ModelSKUstd.setData(Jdata);
        },
        SUCCESSMenu: function (Jdata, oButton) {
            var oState = oButton.getState();
            if (oState === "Non trasferito") {
                Jdata.menu[0].attivo = false;
                Jdata.menu[1].attivo = true;
                Jdata.menu[2].attivo = true;
                Jdata.menu[3].attivo = true;
                Jdata.menu[4].attivo = true;
                Jdata.menu[5].attivo = false;
                Jdata.menu[6].attivo = true;
                Jdata.menu[7].attivo = false;
                Jdata.menu[8].attivo = false;
            }
            this.ModelMenu.setData(Jdata);
        },
        SUCCESSFormati: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{formati>ID}",
                    text: "{formati>formato}"
                });
                selectBox.setModel(oModel, "formati");
                selectBox.bindAggregation("items", "formati>/formati", oItemSelectTemplate);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        SUCCESSListaSKU: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var selectBox = this.getView().byId("SKU");
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    text: "{SKUCodiciInterni>SKUCodiciInterno}"
                });
                selectBox.setModel(oModel, "SKUCodiciInterni");
                selectBox.bindAggregation("items", "SKUCodiciInterni>/SKUCodiciInterni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        SUCCESSConfezionamenti: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{confezionamenti>ID}",
                    text: "{confezionamenti>confezione} {confezionamenti>grammatura}gr"
                });
                selectBox.setModel(oModel, "confezionamenti");
                selectBox.bindAggregation("items", "confezionamenti>/confezioni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        SUCCESSDestinazione: function (Jdata, oRow, row_binded) {
            if (Number(Jdata.error) === 0) {
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
                oRow.getCells()[7].setEnabled(true);
                oRow.getCells()[4].setText(Jdata.destinazione);
                oRow.setEnabled(true);
                row_binded.pezzi_cartone = Number(Jdata.pezziCartone);
                row_binded.tempo_ciclo = Number(Jdata.secondiPerPezzo);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        SUCCESSDestinazioni: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    text: "{destinazioni>destinazione}"
                });
                selectBox.setModel(oModel, "destinazioni");
                selectBox.bindAggregation("items", "destinazioni>/destinazioni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        SUCCESSQuantita: function (Jdata) {
            if (Jdata.error === 0) {
                var rowPath = this.row.getBindingContext("linea").sPath;
                var row_binded = this.getView().getModel("linea").getProperty(rowPath);
                row_binded.pezziCartone = Jdata.pezziCartone;
                row_binded.secondiPerPezzo = Jdata.secondiPerPezzo;
                this.row.getCells()[2].setValue(this.getView().byId("formato_SKU").getValue());
                this.row.getCells()[3].setValue(this.getView().byId("confezione_SKU").getValue());
                this.row.getCells()[4].setValue(this.getView().byId("cliente_SKU").getValue());
                this.row.getCells()[5].setValue("");
                this.row.getCells()[6].setValue("");
                this.row.getCells()[7].setValue("");
                this.row.getCells()[8].setVisible(true);
                row_binded.SKUCodiceInterno = this.getView().byId("SKU").getValue();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        changeReparto: function (oEvent) {
            var link;
            var that = this;
            var area = this.piano.area;
            this.repartoID = oEvent.getParameters().key;
            if (this.ISLOCAL === 0) {
                if (area === "0") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else if (area === "1") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else if (area === "2") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                }
                Library.AjaxCallerData(link, function (Jdata) {
                    that.ModelLinea.setData(Jdata);
                });
                this.getView().setModel(this.ModelLinea, "linee");
            }
        },
        takeAllCause: function (bck) {
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    bck[key] = this.takeAllCause(bck[key]);
                }
            }
            if (bck.fermo !== undefined) {
                this.data_json.cause.push(bck);
            }
            return bck;
        },
        onNavBack: function () {
            this.STOP = 1;
//            this.removeAddButtons();
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("overview", true);
            }
        },
        removeAddButtons: function () {
           var oTable, oRows;
           this.getView().byId("managePianoTable");
           var oTables = this.getView().byId("managePianoTable").getItems();
           for (var i = 0; i < oTables.length; i++) {
               oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
               oRows = oTable.getItems();
               oTable.removeItem(oRows.length-1);
           }
       },
        handlePressOpenMenu: function (oEvent) {
            this.oButton = oEvent.getSource();
            var PathBatch = this.oButton.getParent().getBindingContext("linea").sPath;
            var PathLinea = this.oButton.getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            this.linea = this.getView().getModel("linea").getProperty(PathLinea);
            this.batch_id = this.getView().getModel("linea").getProperty(PathBatch).batchID;
//            this.batch = this.getView().getModel("linea").getProperty(PathBatch);
            this.row = oEvent.getSource().getParent();
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/prova.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetMenuFromBatchID&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.SUCCESSMenuOpened.bind(this));
        },
        SUCCESSMenuOpened: function (Jdata) {
            this.ModelMenu.setData(Jdata);
            this.getView().setModel(this.ModelMenu);
            if (!this._menu) {
                this._menu = sap.ui.xmlfragment(
                        "myapp.view.MenuItemEventing",
                        this
                        );
                this.getView().addDependent(this._menu);
            }
            var eDock = sap.ui.core.Popup.Dock;
//            this.callMenu(this.oButton);
//            this.getView().setModel(this.ModelMenu);
            this._menu.setModel(this.prova);
            this._menu.open(this._bKeyboard, this.oButton, eDock.BeginTop, eDock.BeginBottom, this.oButton);
        },
//        callMenu: function (oButton) {
//            var that = this;
//            Library.AjaxCallerData("./model/prova.json", function (Jdata) {
//                that.SUCCESSMenu.bind(that)(Jdata, oButton);
//            });
//        },
// MODIFICA DELLA VIEW DELLA CREAZIONE TURNO (IN REALTA' DISTINGUO SOLO IL CASO IN CUI IL TURNO E' IN CORSO)
        addFieldsCreazione: function () {
            var j, oTable, oRows, oButton, oCell, columnListItem;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
                if (oRows.length === 0) {
                    oButton = new sap.m.Button({
                        icon: "sap-icon://add",
                        press: this.onAddItem.bind(this)
                    });
                    columnListItem = new sap.m.ColumnListItem({
                        cells: [
                            oButton
                        ]});
                    columnListItem.addStyleClass("sapMListTblCell_b");
                    oTable.addItem(columnListItem);

                } else {
                    if (oRows[oRows.length - 1].getCells().length !== 1) {
                        oButton = new sap.m.Button({
                            icon: "sap-icon://add",
                            press: this.onAddItem.bind(this)
                        });
                        columnListItem = new sap.m.ColumnListItem({
                            cells: [
                                oButton
                            ]
                        });
                        columnListItem.addStyleClass("sapMListTblCell_b");
                        oTable.addItem(columnListItem);
                    }
                    oRows = oTable.getItems();
                    for (j = 0; j < oRows.length - 1; j++) {
////                        if (oRows[j].getCells().length >= 8) {
////                            oRows[j].removeCell(7);
////                            oRows[j].removeCell(6);
////                            oRows[j].removeCell(5);
////                            this.addCellInput(oRows[j]);
////                        } else if (oRows[j].getCells().length < 8 && oRows[j].getCells().length > 1) {
////                            this.addCellInput(oRows[j]);
////                        }
//                        oRows[j].removeCell(1);
//                        oCell = new sap.m.Input({
//                            value: "{linea>sequenza}",
//                            width: "4rem",
//                            type: "Number",
//                            textAlign: "Center"
//                        });
//                        oRows[j].insertCell(oCell, 1);
                        if (j === oRows.length - 2) {
                            var row_path = oRows[j].getBindingContext("linea").sPath;
                            var row_binded = this.getView().getModel("linea").getProperty(row_path);
                            if (!row_binded.batchID) {
                                oRows[j].getCells()[8].setVisible(true);
                            }
                        }
                    }
                }
            }
        },
        addCellInput: function (oRow) {
            var oInput;
            oInput = new sap.m.Input({
                value: "{linea>qli}",
                width: "4rem",
                type: "Number",
                textAlign: "Center",
                liveChange: this.ChangeValues.bind(this)
            });
            oRow.insertCell(oInput, 5);
            oInput = new sap.m.Input({
                value: "{linea>cartoni}",
                width: "4rem",
                type: "Number",
                textAlign: "Center",
                liveChange: this.ChangeValues.bind(this)
            });
            oRow.insertCell(oInput, 6);
            oInput = new sap.m.TimePicker({
                value: "{linea>ore}",
                valueFormat: "HH:mm",
                displayFormat: "HH:mm",
                change: this.ChangeValues.bind(this)
            });
            oInput.addStyleClass("TimesapMInputBase");
            oRow.insertCell(oInput, 7);
        },
        ChangeValues: function (oEvent) {
            var row_path = oEvent.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            this.pezzi_cartone = row_binded.pezziCartone;
            this.tempo_ciclo = row_binded.secondiPerPezzo;
            var grammatura, numero_pezzi, cartoni, ore, quintali;
            var oValueChanged = oEvent.getParameter("value");
            var oCellChanged = oEvent.getSource();
            var oRow = oEvent.getSource().getParent();
            var oValue = oRow.getCells()[3].getValue();
            grammatura = Number(oValue.split(" ")[1].slice(0, oValue.split(" ")[1].length - 2));
            if (oCellChanged === oRow.getCells()[5]) {
                numero_pezzi = (oValueChanged * 100) / (grammatura / 1000);
                cartoni = Math.ceil(numero_pezzi / this.pezzi_cartone);
                oRow.getCells()[6].setValue(cartoni);
                ore = Math.ceil((numero_pezzi * this.tempo_ciclo) / 60);
                oRow.getCells()[7].setValue(Library.minutesToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[6]) {
                numero_pezzi = oValueChanged * this.pezzi_cartone;
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[5].setValue(Library.roundTo(quintali, 2));
                ore = Math.ceil((numero_pezzi * this.tempo_ciclo) / 60);
                oRow.getCells()[7].setValue(Library.minutesToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[7]) {
                numero_pezzi = Library.standardToMinutes(oValueChanged) / (this.tempo_ciclo / 60);
                cartoni = Math.ceil(numero_pezzi / this.pezzi_cartone);
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[5].setValue(Library.roundTo(quintali, 2));
                oRow.getCells()[6].setValue(cartoni);
            }
            oRow.getCells()[8].setVisible(true);
        },
        changeFields: function () {
            var j, oTable, oRows, oText;
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                oTable = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0];
                oRows = oTable.getItems();
//                oTable.removeItem(oRows[oRows.length - 1]);
                for (j = 0; j < oRows.length - 1; j++) {
                    if (oRows[j].getCells().length >= 8) {
                        oRows[j].removeCell(7);
                        oRows[j].removeCell(6);
                        oRows[j].removeCell(5);
                    }
                    oText = new sap.m.Text({text: "{linea>qli}"});
                    oRows[j].insertCell(oText, 5);
                    oText = new sap.m.Text({text: "{linea>cartoni}"});
                    oRows[j].insertCell(oText, 6);
                    oText = new sap.m.Text().bindText({path: 'linea>ore', formatter: this.TimeFormatter.TimeText});
                    oRows[j].insertCell(oText, 7);

                    oRows[j].removeCell(1);
                    oText = new sap.m.Text({
                        text: "{linea>sequenza}",
                        width: "4rem"
                    });
                    oRows[j].insertCell(oText, 1);
                }
            }
        },
// AGGIUNGO UNA RIGA QUANDO PREMO SU AGGIUNGI RIGA
        onAddItem: function (oEvent) {
            this.STOP = 1;
            var columnListItem;
            var oTable = oEvent.getSource().getParent().getParent();
            oEvent.getSource().getParent().getParent().removeItem(oEvent.getSource().getParent());
            var Model = this.getView().getModel("linea");
            var oData = Model.getData();
            var oLinea_path = oEvent.getSource().getBindingContext("linea").getPath().split("/");
            var obj = {};
            var last_batch = oData[oLinea_path[1]][oLinea_path[2]].lastbatch[0];
            obj.sequenza = last_batch.sequenza;
            obj.formatoProduttivo = last_batch.formatoProduttivo;
            obj.confezione = last_batch.confezione;
            obj.grammatura = last_batch.grammatura;
            obj.destinazione = last_batch.destinazione;
            obj.secondiPerPezzo = last_batch.secondiPerPezzo;
            obj.pezziCartone = last_batch.pezziCartone;
            oData[oLinea_path[1]][oLinea_path[2]].batchlist.push(obj);
            oEvent.getSource().getParent().destroy();
//            oTable.removeItem(oTable.getItems(oRows.length-1));
////            var timePicker = new sap.m.TimePicker({value: "", valueFormat: "HH:mm", width: "7rem", displayFormat: "HH:mm", change: this.ChangeValues.bind(this)});
////            timePicker.addStyleClass("TimesapMInputBase");
////            var columnListItem = new sap.m.ColumnListItem({
////                cells: [
////                    new CustomButt({text: "", customType: "batch", state: "Non trasferito", press: this.handlePressOpenMenu.bind(this)}),
////                    new sap.m.Input({value: last_batch.sequenza, type: "Number", width: "4rem", textAlign: "Center"}),
////                    new sap.m.ComboBox({value: last_batch.formatoProduttivo, width: "100%", loadItems: this.CaricaFormati.bind(this), selectionChange: this.ResetConfezionamenti.bind(this)}),
////                    new sap.m.ComboBox({value: last_batch.confezione + " " + last_batch.grammatura + "gr", loadItems: this.CaricaConfezionamenti.bind(this), selectionChange: this.loadDestinazione.bind(this)}),
////                    new sap.m.Button({text: last_batch.destinazione, press: this.visuBatch.bind(this)}),
////                    new sap.m.Input({value: "", width: "4rem", type: "Number", liveChange: this.ChangeValues.bind(this), textAlign: "Center"}),
////                    new sap.m.Input({value: "", width: "4rem", type: "Number", liveChange: this.ChangeValues.bind(this), textAlign: "Center"}),
////                    timePicker,
////                    new sap.m.Button({visible: true, press: this.confermaCreazioneBatch.bind(this)})
////                ]
////            });
//            columnListItem.addStyleClass("noDelimitator sapMListTblCell_b");
//            oTable.addItem(columnListItem);
//            oTable.rerender();
            Model.setData(oData);
            this.addFieldsCreazione();
////            this.getView().setModel(Model, "linea");
//            var oButton = new sap.m.Button({
//                icon: "sap-icon://add",
//                press: this.onAddItem.bind(this)
//            });
//            columnListItem = new sap.m.ColumnListItem({
//                cells: [
//                    oButton
//                ]
//            });
//            columnListItem.addStyleClass("noDelimitator sapMListTblCell_b");
//            oTable.addItem(columnListItem);
//            oTable.rerender();
//            oTable.rerender();
//            this.addFieldsCreazione();
        },
        confermaCreazioneBatch: function (oEvent) {
            var PathLinea = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var oRow = oEvent.getSource().getParent();
            var rowPath = oEvent.getSource().getParent().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            var array_confezione = oRow.getCells()[3].getValue().split(" ");
            var that = this;
            var link;
            var obj = {};
            if (row_binded.batchID) {
                obj.batchId = row_binded.batchID;
            } else {
                obj.batchId = "";
            }
            obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
            obj.pianodiconfezionamento = this.pdcID;
            obj.lineaId = this.linea_id;
            obj.formatoProduttivo = oRow.getCells()[2].getValue();
            obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
            obj.tipologia = array_confezione[0];
            obj.sequenza = oRow.getCells()[1].getValue();
            obj.destinazione = oRow.getCells()[4].getText();
            obj.quintali = oRow.getCells()[5].getValue();
            obj.cartoni = oRow.getCells()[6].getValue();
            obj.ore = oRow.getCells()[7].getValue();
            var doc_xml = Library.createXMLBatch(obj);
            if (Number(this.ISLOCAL) === 1) {
                oRow.getCells()[8].setVisible(false);
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/InsertUpdateBatch&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, function (Jdata) {
                    if (Number(Jdata.error) === 0) {
                        oRow.getCells()[8].setVisible(false);
                        that.STOP = 0;
                    } else {
                        MessageToast.show(Jdata.errorMessage, {duration: 30});
                    }
                });
            }

        },
//GESTIONE VISUALIZZA ATTRIBUTI BATCH
        azioneBatch: function (oEvent) {
            var oText = oEvent.getParameter("item").getText();
            var link;
            switch (oText) {
                case "Visualizza Attributi Batch":
                    this.visuBatch();
                    break;
                case "Trasferimento Batch a Linea":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboTrasferimento&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTrasferimentoBatch.bind(this));
                    break;
                case "Trasferimento Batch a Linea (solo attrezzaggio)":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboTrasferimentoPredisposizione&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSTrasferimentoBatchAttrezzaggio.bind(this));
                    break;
                case "Richiamo Batch":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchRichiamo&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSRichiamoBatch.bind(this));
                    break;
                case "Cancellazione Batch":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
                    break;
            }

        },
        visuBatch: function (oEvent) {
//            var linea_path = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
//            this.linea = this.getView().getModel("linea").getProperty(linea_path);
            var oRow = oEvent.getSource().getParent();
            if (!oRow.getCells) {
                oRow = this.row;
            }
            this.row = oRow;
            var oView;
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            if (this.ISLOCAL === 1) {
                oView = this.getView();
                var std = this.getView().getModel("SKUstd").getData();
                var bck = this.getView().getModel("SKU").getData();
                bck = Library.RecursiveJSONComparison(std, bck, "attributi");
                bck = Library.RecursiveParentExpansion(bck);
                this.ModelSKU.setData(bck);
                this.getView().setModel(this.ModelSKU, "SKU");
                this.oDialog = oView.byId("modificaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[3].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[4].getText());
                this.getView().byId("cliente_SKU").setValue(row_binded.SKUCodiceInterno);
                Library.RemoveClosingButtons.bind(this)("attributiContainer");
                this.oDialog.open();
            } else {
                oView = this.getView();
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
                obj.formatoProduttivo = row_binded.formatoProduttivo;
                obj.tipologia = row_binded.tipologia;
                obj.grammatura = row_binded.grammatura;
                obj.destinazione = row_binded.destinazione;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch();
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU());
                this.oDialog = oView.byId("modificaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[3].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[4].getText());
                this.getView().byId("SKU").setValue(row_binded.SKUCodiceInterno);
                Library.RemoveClosingButtons.bind(this)("attributiContainer");
                this.oDialog.open();
            }
        },
        SUCCESSTrasferimentoBatch: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            this.getView().setModel(this.ModelLinea, "linea");
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
        },
        SUCCESSTrasferimentoBatchAttrezzaggio: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            this.getView().setModel(this.ModelLinea, "linea");
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
        },
        SUCCESSRichiamoBatch: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                this.RefreshCall();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        SUCCESSCancellazioneBatch: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                this.RefreshCall();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 30});
            }
        },
        closeDialog: function () {
            this.oDialog.close();
        },
        destroyDialog: function () {
            this.oDialog.destroy();
        },
// GESTIONE POPUP STATO LINEA
        onOpenStatoLinea: function () {
            var oView = this.getView();
//            this.getView().setModel(this.ModelSKU, "SKU");
            this.oDialog = oView.byId("statoLinea");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.statoLinea", this);
                oView.addDependent(this.oDialog);
            }
            if (Number(this.ISLOCAL) === 1) {
                Library.AjaxCallerData("./model/JSON_FermoTestiNew.json", this.SUCCESSCause.bind(this));
                this.getView().setModel(this.ModelCause, "cause");
            }
            oView.byId("disponibile").setSelected(true);
            oView.byId("nondisponibile").setSelected(false);
            this.collapse();
            this.oDialog.open();
        },
        onGestioneStato: function (oEvent) {
            var oText = oEvent.getSource().getText();
            if (oText === "Disponibile per la produzione") {
                this.getView().byId("disponibile").setSelected(true);
                this.getView().byId("nondisponibile").setSelected(false);
                this.collapse();
            } else {
                this.getView().byId("nondisponibile").setSelected(true);
                this.getView().byId("disponibile").setSelected(false);
                this.expand();
            }
        },
        expand: function () {
            var VBox = this.getView().byId("nondisponibileBox");
            for (var i = 0; i < VBox.getItems().length; i++) {
                VBox.getItems()[i].getItems()[1].setEnabled(true);
                VBox.getItems()[i].getItems()[0].removeStyleClass("textNotEnabled");

            }
        },
        collapse: function () {
            var VBox = this.getView().byId("nondisponibileBox");
            for (var i = 0; i < VBox.getItems().length; i++) {
                VBox.getItems()[i].getItems()[1].setEnabled(false);
                VBox.getItems()[i].getItems()[0].addStyleClass("textNotEnabled");
            }
        },

// RITORNARE ALLA VIEW MAIN
        onMenu: function () {
            this.STOP = 1;
            this.getView().setModel(null,"linea");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("main", true);
        },
        manageSPCButton: function () {
            var oItems = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oItems.length; i++) {
                var SPCButton = oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
                if (Number(this.piano.area) === 1) {
                    SPCButton.getParent().setVisible(true);
                    SPCButton.getParent().setWidth("10%");
                    oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].setWidth("90%");
                    SPCButton.setVisible(true);
//                    oItems[i].getCells()[0].getItems()[0].getI    tems()[1].getItems()[0].getItems()[0].removeStyleClass("prova");
                } else {
                    SPCButton.getParent().setVisible(false);
                    SPCButton.getParent().setWidth("0%");
                    oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].setWidth("100%");
                    SPCButton.setVisible(false);
//                    oItems[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].addStyleClass("prova");
                }
            }
        },
//GESTIONE DEI FORMATI E CONFEZIONAMENTI
        showUpdateButton: function (oEvent) {
            var oRow = oEvent.getSource().getParent();
            oRow.getCells()[8].setVisible(true);
        },
        enableSKU: function () {
            this.getView().byId("SKU").destroyItems();
            this.getView().byId("SKU").setValue("");
            this.getView().byid("SKU").setEnabled(true);
        },
        changeSKU: function () {
            if (this.ISLOCAL !== 1) {
                var array_confezione = this.getView().byId("confezione_SKU").getValue();
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.SKUCodiceInterno = this.getView().byId("SKU").getValue();
                obj.formatoProduttivo = this.getView().byId("formato_SKU").getValue();
                obj.tipologia = array_confezione[0];
                obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch();
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU());
            }
        },
        enableDestinazioni: function () {
            this.getView().byId("cliente_SKU").destroyItems();
            this.getView().byId("cliente_SKU").setValue("");
            this.getView().byId("cliente_SKU").setEnabled(true);
            this.getView().byId("SKU").destroyItems();
            this.getView().byId("SKU").setValue("");
            this.getView().byid("SKU").setEnabled(false);
        },
        confermaModifiche: function () {
            var lineaPath = this.row.getParent().getBindingContext("linea").sPath;
//            var rowPath = this.row.getBindingContext("linea").sPath;
//            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            var linea_binded = this.getView().getModel("linea").getProperty(lineaPath);
            if (this.ISLOCAL !== 1) {
                var array_confezione = this.getView().byId("confezione_SKU").getValue().split(" ");
                var obj = {};
                obj.lineaId = linea_binded.lineaID;
                obj.formatoProduttivo = this.getView().byId("formato_SKU").getValue();
                obj.tipologia = array_confezione[0];
                obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoNewBatch&Content-Type=text/json&xml=" + Library.createXMLBatch(obj);
                Library.AjaxCallerData(link,
                        this.SUCCESSQuantita.bind(this));
            }
        },
        CaricaSKU: function () {
            var link;
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            this.getView().byId("SKU");
            if (this.ISLOCAL !== 1) {
                var array_confezione = this.getView().byId("confezione_SKU").getValue();
                var obj = {};
                obj.SKUCodiceInterno = row_binded.SKUCodiceInterno;
                obj.pianodiconfezionamento = this.pdcID;
                obj.lineaId = this.linea_id;
                obj.formatoProduttivo = this.row.getCells()[2].getValue();
                obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                obj.tipologia = array_confezione[0];
                obj.sequenza = this.row.getCells()[1].getValue();
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                obj.quintali = this.row.getCells()[5].getValue();
                obj.cartoni = this.row.getCells()[6].getValue();
                obj.ore = this.row.getCells()[7].getValue();
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllSKUCodiceInternoFiltered &Content-Type=text/json&xml=" + Library.createXMLBatch(obj);
                Library.AjaxCallerData(link, this.SUCCESSListaSKU.bind(this));
            }
        },
        CaricaFormati: function (oEvent) {
            var link;
            var that = this;
            var SelectBox = oEvent.getSource();
            if (this.ISLOCAL === 1) {
                link = "model/formati.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFormatiFilteredByLineID&Content-Type=text/json&LineaID=" + this.linea_id + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSFormati.bind(that)(Jdata, SelectBox);
            });
        },
        CaricaConfezionamenti: function (oEvent) {
            var link, formato;
            var that = this;
            var SelectBox = oEvent.getSource();
            if (this.getView().byId("formato_SKU")) {
                formato = this.getView().byId("formato_SKU").getValue();
            } else {
                formato = oEvent.getSource().getParent().getCells()[2].getValue();
            }
            if (Number(this.ISLOCAL) === 1) {
                link = "model/confezionamenti.json";
            }
            if (Number(this.ISLOCAL) !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllConfezioniFilteredByLineIDAndFormatoProduttivo&Content-Type=text/json&LineaID=" + this.linea_id + "&FormatoProduttivo=" + formato + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSConfezionamenti.bind(that)(Jdata, SelectBox);
            });
        },
        ResetConfezionamentiDialog: function () {
            var selectBox = this.getView().byId("confezione_SKU");
            selectBox.destroyItems();
            selectBox.setValue("");
            var destinazione = this.getView().byId("cliente_SKU");
            var SKU = this.getView().byId("SKU");
            destinazione.destroyItems();
            destinazione.setValue("");
            destinazione.setEnabled(false);
            SKU.destroyItems();
            SKU.setValue("");
            SKU.setEnabled(false);
        },
        ResetConfezionamenti: function (oEvent) {
            var oRow = oEvent.getSource().getParent();
            var selectBox = oRow.getCells()[3];
            selectBox.destroyItems();
            selectBox.setValue("");
            var Button = oRow.getCells()[4];
            Button.setText("");
            Button.setEnabled(false);
            oRow.getCells()[5].setValue("");
            oRow.getCells()[6].setValue("");
            oRow.getCells()[7].setValue("");
            oRow.getCells()[5].setEnabled(false);
            oRow.getCells()[6].setEnabled(false);
            oRow.getCells()[7].setEnabled(false);
            oRow.getCells()[8].setVisible(true);
        },
        loadDestinazione: function (oEvent) {
            var that = this;
            var PathLinea = oEvent.getSource().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var link;
            var oRow = oEvent.getSource().getParent();
            var row_path = oEvent.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            var Button = oRow.getCells()[4];
            if (this.ISLOCAL === 1) {
                row_binded.pezziCartone = 10;
                Button.setText("ITALIA + ESTERO");
                Button.setEnabled(true);
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
                oRow.getCells()[7].setEnabled(true);
            } else {
                var array_confezione = oRow.getCells()[3].split(" ");
                var obj = {};
                obj.lineaID = this.linea_id;
                obj.formatoProduttivo = oRow.getCells()[2].getValue();
                obj.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                obj.tipologia = array_confezione[0];
                var doc_xml = Library.createXMLDestinazione(obj);
                link = "DeCecco/Transactions/GetInfoNewBatchStandard&Content-Type=text/json&xml=" + doc_xml;
                Library.AjaxCallerData(link, function (Jdata) {
                    that.SUCCESSDestinazione.bind(that)(Jdata, oRow, row_binded);
                });
            }
            oRow.getCells()[8].setVisible(true);
        },
        CaricaDestinazioni: function () {
            var link;
            var that = this;
            var array_confezione = this.getView().byId("confezione_SKU").getValue().split(" ");
            var selectBox = this.getView().byId("cliente_SKU");
            if (this.ISLOCAL !== 1) {
                link = "DeCecco/Transactions/GetAllDestinazioniFiltered&Content-Type=text/json&LineaID=" + this.linea.lineaID + "&FormatoProduttivo=" + this.getView().byId("formato_SKU") + "&Tipologia=" + array_confezione[0] + "&Grammatura=" + array_confezione[1].slice(0, array_confezione[1].length - 2);
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSDestinazioni.bind(that)(Jdata, selectBox);
            });
        },
// FUNZIONI LOCALI
        LOCALTakeLineaById: function (id, obj) {
            for (var j = 0; j < this.ModelLinea.getData().linee.length; j++) {
                if (Number(this.ModelLinea.getData().linee[j].id) === Number(id)) {
                    this.ModelLinea.getData().linee[j].batchlist.push(obj);
                    return;
                }
            }
            return;
        }
    });
    return ManagePiano;
});