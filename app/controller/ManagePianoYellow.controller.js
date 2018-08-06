sap.ui.define([
    'sap/m/MessageToast',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/controller/Library',
    'myapp/model/TimeFormatter',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (MessageToast, Controller, JSONModel, History, Library, TimeFormatter, Filter, FilterOperator) {
    "use strict";
    var ManagePianoYellow = Controller.extend("myapp.controller.ManagePianoYellow", {

//        VARIABILI GLOBALI
        checkSingoloCausa: null,
        checkTotaleCausa: null,
        ModelGuastiLinea: null,
        ModelCausali: new JSONModel({}),
        StabilimentoID: null,
        pdcID: null,
        repartoID: null,
        linea_id: null,
        confezione: null,
        grammatura: null,
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
        ModelParametri: new JSONModel({}),
        ModelSKU: new JSONModel({}),
        ModelTurni: null,
        ModelSKUstd: new JSONModel({}),
        ModelCause: new JSONModel({}),
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
        RefreshLogCounter: 10,
        STOP: 0,
        STOPLOG: 0,
        oButton: null,
        TTBackup: new JSONModel({}),
        BusyDialog: new sap.m.BusyDialog(),
        Counter: null,
        RefreshCounter: null,
        bckupSEQ: "",
        bckupQLI: "",
        bckupCRT: "",
        bckupHOUR: "",
        TIMER: null,
        NDTIMER: null,
        getDialog: null,
//        FUNZIONI D'INIZIALIZZAZIONE
        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePianoYellow").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (event) {
            clearInterval(this.TIMER);
            this.getDialog = sap.ui.getCore().byId("GlobalBusyDialog");
            this.getDialog.close();
            this.RefreshCounter = 0;
            this.RefreshLogCounter = 10;
            this.Counter = 0;
            this.STOP = 0;
            this.StabilimentoID = sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID;
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").getData().pdc;
            this.repartoID = sap.ui.getCore().getModel("ParametriPiano").getData().reparto;
            this.ModelLinea = sap.ui.getCore().getModel("linee");
            this.ModelTurni = sap.ui.getCore().getModel("turni");
            if (Number(this.ISLOCAL) === 1) {
                Library.AjaxCallerData("model/operators.json", this.LOCALSUCCESSDatiOperatore.bind(this));
                this.getView().setModel(this.ModelOperatori, 'operatore');
                Library.AjaxCallerData("model/SKU_standard.json", this.LOCALSUCCESSSKUstd.bind(this));
                this.getView().setModel(this.ModelSKUstd, 'SKUstd');
                Library.AjaxCallerData("model/SKU_backend.json", this.SUCCESSSKU.bind(this));
                this.getView().setModel(this.ModelSKU, 'SKU');
            }
            if (typeof event !== "undefined") {
                this.turnoPath = event.getParameter("arguments").turnoPath;
                this.pianoPath = event.getParameter("arguments").pianoPath;
                this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            }
            var oTitle = this.getView().byId("Title");
            oTitle.setText(this.piano.data + "    -    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
            this.getView().setModel(this.ModelLinea, 'linea');
            var oModel = new JSONModel({inizio: this.piano.turno.split("-")[0].trim(), fine: this.piano.turno.split("-")[1].trim()});
            this.getView().setModel(oModel, "orarioturno");
            this.RefreshFunction(100, "0");
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
        SUCCESSSKU: function (Jdata) {
            var bck = Jdata.SKUattuale;
            var std = Jdata.SKUstandard;
            bck = Library.RecursiveJSONComparison(std, bck, "attributi");
            bck = Library.RecursiveParentExpansion(bck);
            this.ModelSKU.setData(bck);
            this.getView().setModel(this.ModelSKU, "SKU");
            setTimeout(this.ShowRelevant.bind(this), 50, null, "SKU_TT");
        },
//        FUNZIONI DI REFRESH
        RefreshFunction: function (msec, IsRidotta) {
            this.RefreshCounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            if (typeof IsRidotta === "undefined") {
                IsRidotta = "1";
                if ((this.Counter % 6) === 0) {
                    IsRidotta = "0";
                }
            }
            this.Counter++;
            setTimeout(this.RefreshCall.bind(this), msec, IsRidotta);
        },
        RefreshCall: function (IsRidotta) {
            if (typeof IsRidotta === "undefined") {
                IsRidotta = "0";
            }
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&IsRidotta=" + IsRidotta + "&OutputParameter=JSON";
            Library.SyncAjaxCallerData(link, this.RefreshDataSet.bind(this));
        },
        RefreshDataSet: function (Jdata) {
            if (this.ISLOCAL !== 1) {
                if (Jdata.area !== "2") {
                    this.BackToPiani();
                }
                this.pdcID = Jdata.pdcId;
                if (this.STOP === 0) {
                    var temp = JSON.parse(JSON.stringify(this.ModelLinea.getData()));
                    if (Jdata.isRidotta === "0") {
                        this.ModelLinea.getData().linee = this.ModelFullUpdate(Jdata.linee, temp.linee);
                    } else {
                        this.ModelLinea.getData().linee = this.ModelPartialUpdate(Jdata.linee, temp.linee, ["batchlist", "operatori", "lastbatch"]);
                    }
                    this.ModelLinea.setData(this.ModelLinea.getData());
                    this.getView().setModel(this.ModelLinea, "linea");
                    sap.ui.getCore().setModel(this.ModelLinea, "linee");
                    this.SettingsButtonColor();
                    this.LineButtonStyle();
                    this.RefreshCounter = 0;
                }
            }
        },
        ModelFullUpdate: function (newData, oldData) {
            for (var i = 0; i < newData.length; i++) {
                for (var key in newData[i]) {
                    if (key === "batchlist") {
                        for (var j = 0; j < newData[i][key].length; j++) {
                            if (typeof oldData[i][key][j].modifyBatch === "undefined" || oldData[i][key][j].modifyBatch !== 1) {
                                oldData[i][key][j] = newData[i][key][j];
                            }
                        }
                    } else {
                        oldData[i][key] = newData[i][key];
                    }
                }
            }
            return oldData;
        },
        ModelPartialUpdate: function (newData, oldData, exceptions) {
            for (var i = 0; i < newData.length; i++) {
                for (var key in newData[i]) {
                    if (exceptions.indexOf(key) === -1) {
                        oldData[i][key] = newData[i][key];
                    }
                }
            }
            return oldData;
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> FUNZIONI CHIAMATE AL CLICK <<<<<<<<
//        
//        ************************ INTESTAZIONE ************************
//        
//         -> PULSANTE D'USCITA
        BackToPiani: function () {
            clearInterval(this.TIMER);
            var AddButton;
            for (var i = 0; i < this.ModelLinea.getData().linee.length; i++) {
                AddButton = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
                AddButton.setEnabled(true);
            }
            this.DeleteUncompleteBatches();
            this.STOP = 1;
            this.getView().byId("ManageIconTabBar").setSelectedKey("1");
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("overview", true);
            }
        },
//         -> PULSANTE AGGIORNA
        RefreshButton: function () {
            this.BusyDialog.open();
            this.RefreshFunction(0, "0");
            this.BusyDialog.close();
        },
//         -> CAMBIO REPARTO
        ChangeReparto: function (event) {
            var link;
            var that = this;
            this.repartoID = event.getParameters().key;
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&IsRidotta=0&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, function (Jdata) {
                    that.ModelLinea.setData(Jdata);
                });
                this.SettingsButtonColor();
                this.LineButtonStyle();
                this.getView().setModel(this.ModelLinea, "linea");
            }
        },
//        
//        
//        ************************ TABELLA 20% DI SINISTRA ************************
//        
//         -> PULSANTE DELLA LINEA
        ShowStatoLinea: function (event) {
            clearInterval(this.NDTIMER);
            this.BusyDialog.open();
            this.linea_id = this.getView().getModel("linea").getProperty(event.getSource().getBindingContext("linea").sPath).lineaID;
            this.STOPLOG = 0;
            var link;
            var oView = this.getView();
            this.oDialog = oView.byId("statoLinea");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.statoLinea", this);
                oView.addDependent(this.oDialog);
            }
            if (Number(this.ISLOCAL) === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllNonDisponibilitaFromPdcIDAndLineaID&Content-Type=text/json&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&OutputParameter=JSON";
            }
            this.oDialog.open();
            this.RefreshLogCounter = 5;
            var that = this;
            this.NDTIMER = setInterval(function () {
                try {
                    that.RefreshLogCounter++;
                    if (that.STOPLOG === 0 && that.RefreshLogCounter >= 5) {
                        that.RefreshLogFunction();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },
        SUCCESSFermiProgrammati: function (Jdata) {
            if (this.oDialog) {
                if (this.oDialog.isOpen()) {
                    var data;
                    data = Library.AddTimeGapsFermiProgrammati(Jdata);
                    if (data.nondisponibilita.length > 0) {
                        if (data.nondisponibilita[0].isAttivo === "1") {
                            this.getView().byId("FermiProgrammatiTable").addStyleClass("RedLine");
                            this.getView().byId("RiavviaSubito").setEnabled(true);
                        } else {
                            this.getView().byId("FermiProgrammatiTable").removeStyleClass("RedLine");
                            this.getView().byId("RiavviaSubito").setEnabled(false);
                        }
                    } else {
                        this.getView().byId("FermiProgrammatiTable").removeStyleClass("RedLine");
                        this.getView().byId("RiavviaSubito").setEnabled(false);
                    }
                    this.ModelCause.setData(data);
                    this.getView().setModel(this.ModelCause, "fermiprogrammati");
                    this.BusyDialog.close();
                    if (this.STOPLOG === 0) {
                        this.RefreshLogCounter = 0;
                    }
                }
            }
        },
        RefreshLogFunction: function (msec) {
            this.RefreshLogCounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.RefreshLogCall.bind(this), msec);
        },
        RefreshLogCall: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "";
            } else {
                link = link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllNonDisponibilitaFromPdcIDAndLineaID&Content-Type=text/json&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&OutputParameter=JSON";
            }
            Library.SyncAjaxCallerData(link, this.SUCCESSFermiProgrammati.bind(this));
        },
        DestroyDialog: function () {
            clearInterval(this.NDTIMER);
            this.BusyDialog.close();
            this.STOPLOG = 1;
            this.oDialog.destroy();
            this.RerenderTimePickers();
            this.ModelLinea.refresh();
        },
//         -> DROPDOWN OPERATORI
        LoadOperatori: function (event) {
            var that = this;
            var selectBox = event.getSource();
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllOperatori&Content-Type=text/json&OutputParameter=JSON";
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSOperatori.bind(that)(Jdata, selectBox);
            });
        },
        SUCCESSOperatori: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{operatore>addettoID}",
                    text: "{operatore>cognome} {operatore>nome}"
                });
                selectBox.setModel(oModel, "operatore");
                selectBox.bindAggregation("items", "operatore>/operatori", oItemSelectTemplate);
                var aFilter = [];
                var query = this.getView().getModel("linea").getProperty(selectBox.getBindingContext("linea").sPath).sezione;
                if (query) {
                    aFilter.push(new Filter("sezione", FilterOperator.Contains, query));
                }
                selectBox.getBinding("items").filter(aFilter);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        CheckOperatore: function (event) {
            var that = this;
            var check = 0;
            if (event.getSource().getPlaceholder() === "Macchinista") {
                var selectBoxValue = event.getSource().getValue();
                var oTables = this.getView().byId("managePianoTable").getItems();
                for (var i = 0; i < oTables.length; i++) {
                    var table_operatore = oTables[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[0].getContent()[0].getItems();
                    for (var j = 0; j < table_operatore.length; j++) {
                        if (table_operatore[j].getCells()[0].getValue() === selectBoxValue && table_operatore[j].getCells()[0] !== event.getSource()) {
                            table_operatore[j].getCells()[0].setValue("");
                            table_operatore[j].getCells()[0].clearSelection();
                            check = 1;
                            break;
                        }
                    }
                    if (check === 1) {
                        break;
                    }
                }
            }
            var addetto_ID = event.getParameter("selectedItem").getKey();
            var posizione_ID = this.getView().getModel("linea").getProperty(event.getSource().getBindingContext("linea").sPath).posizioneId;
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdatePosizioneAddetto&Content-Type=text/json&AddettoID=" + addetto_ID + "&PosizioneAddettoID=" + posizione_ID + "&OutputParameter=JSON";
            Library.AjaxCallerVoid(link, function () {
                that.RefreshFunction.bind(that);
            }, function (error) {
                console.log(error);
            });
        },
//       ************************ TABELLA 80% DI DESTRA ************************

//         -> PULSANTE AGGIUNTA BATCH
        AddBatch: function (event) {
            var path = event.getSource().getBindingContext("linea").sPath.split("/");
            var index = Number(path[path.indexOf("linee") + 1]);
            var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
            AddButton.setEnabled(false);
            var Model = this.getView().getModel("linea");
            var oData = Model.getData();
            var oLinea_path = event.getSource().getBindingContext("linea").getPath().split("/");
            var obj = {};
            var linea = oData[oLinea_path[1]][oLinea_path[2]];
            var last_batch = linea.lastbatch[0];
            obj.sequenza = last_batch.sequenza;
            obj.formatoProduttivo = last_batch.formatoProduttivo;
            obj.confezione = last_batch.confezione;
            obj.grammatura = last_batch.grammatura;
            obj.confezioneCodiceInterno = last_batch.confezioneCodiceInterno;
            obj.destinazione = last_batch.destinazione;
            obj.secondiPerPezzo = last_batch.secondiPerPezzo;
            obj.pezziCartone = last_batch.pezziCartone;
            obj.modifyBatch = 1;
            obj.SKUCodiceInterno = last_batch.SKUCodiceInterno;
            linea.batchlist.push(obj);
            Model.setData(oData);
            this.getView().setModel(Model, "linea");
        },
//         -> ELEMENTI TABELLA 
//              - INPUT SEQUENZA
        SEQChanged: function (event) {
            var obj = sap.ui.getCore().byId(event.getSource().getId());
            var value = obj.getValue();
            if (isNaN(Number(value))) {
                obj.setValue(this.bckupSEQ);
                MessageToast.show("Inserire solo numeri interi", {duration: 3000});
            } else {
                if (Number(value) < 0) {
                    obj.setValue(this.bckupSEQ);
                    MessageToast.show("Inserire solo numeri interi positivi", {duration: 3000});
                } else {
                    if (value.indexOf(".") > -1) {
                        obj.setValue(this.bckupSEQ);
                        MessageToast.show("Inserire solo numeri interi positivi", {duration: 3000});
                    } else {
                        this.bckupSEQ = value;
                    }
                }
            }
            this.ShowUpdateButton(event);
        },
        ShowUpdateButton: function (event) {
            var rowPath = event.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            row_binded.modifyBatch = 1;
//            this.getView().getModel("linea").refresh();
        },
//              - DROPDOWN FORMATI
        CaricaFormati: function (event) {
            var link;
            var that = this;
            var SelectBox = event.getSource();
            if (this.ISLOCAL === 1) {
                link = "model/formati.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFormatiFilteredByLineID&Content-Type=text/json&LineaID=" + this.linea_id + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSFormati.bind(that)(Jdata, SelectBox);
            });
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
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        ResetConfezionamenti: function (event) {
            this.ShowUpdateButton(event);
            var oRow = event.getSource().getParent();
            var selectBox = oRow.getCells()[2];
            selectBox.destroyItems();
            selectBox.setValue("");
            var Button = oRow.getCells()[3];
            Button.setText("");
            Button.setEnabled(false);
            oRow.getCells()[4].setValue("");
            oRow.getCells()[5].setValue("");
            oRow.getCells()[6].setValue("");
            oRow.getCells()[4].setEnabled(false);
            oRow.getCells()[5].setEnabled(false);
            oRow.getCells()[6].setEnabled(false);
            oRow.getCells()[7].setVisible(true);
        },
//              - DROPDOWN CONFEZIONI
        CaricaConfezionamenti: function (event) {
            var link, formato;
            var that = this;
            var SelectBox = event.getSource();
            if (this.getView().byId("formato_SKU")) {
                formato = this.getView().byId("formato_SKU").getValue();
            } else {
                formato = event.getSource().getParent().getCells()[1].getValue();
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
        SUCCESSConfezionamenti: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{confezionamenti>grammatura}",
                    text: "{confezionamenti>confezione}"
                });
                selectBox.setModel(oModel, "confezionamenti");
                selectBox.bindAggregation("items", "confezionamenti>/confezioni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        LoadDestinazione: function (event) {
            this.ShowUpdateButton(event);
            var that = this;
            var PathLinea = event.getSource().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var link;
            var oRow = event.getSource().getParent();
            var row_path = event.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            row_binded.grammatura = event.getSource().getSelectedItem().getKey();
            row_binded.confezioneCodiceInterno = event.getSource().getSelectedItem().getText();
            var Button = oRow.getCells()[3];
            if (this.ISLOCAL === 1) {
                row_binded.pezziCartone = 10;
                Button.setText("ITALIA + ESTERO");
                Button.setEnabled(true);
                oRow.getCells()[4].setEnabled(true);
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
            } else {
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.SKUCodiceInterno = "";
                obj.sequenza = "";
                obj.destinazione = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.lineaId = this.linea_id;
                obj.formatoProduttivo = oRow.getCells()[1].getValue();
                obj.grammatura = oRow.getCells()[2].getSelectedItem().getKey();
                obj.tipologia = oRow.getCells()[2].getSelectedItem().getText();
                var doc_xml = Library.createXMLBatch(obj);
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoNewBatchStandard&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, function (Jdata) {
                    that.SUCCESSDestinazione.bind(that)(Jdata, oRow, row_binded);
                });
            }
            oRow.getCells()[7].setVisible(true);
        },
        SUCCESSDestinazione: function (Jdata, oRow, row_binded) {
            if (Number(Jdata.error) === 0) {
                oRow.getCells()[4].setEnabled(true);
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
                oRow.getCells()[4].setValue("");
                oRow.getCells()[5].setValue("");
                oRow.getCells()[6].setValue("");
                oRow.getCells()[3].setText(Jdata.destinazione);
                oRow.getCells()[3].setEnabled(true);
                row_binded.pezziCartone = Number(Jdata.pezziCartone);
                row_binded.secondiPerPezzo = Number(Jdata.secondiPerPezzo);
            } else {
                oRow.getCells()[4].setEnabled(false);
                oRow.getCells()[5].setEnabled(false);
                oRow.getCells()[6].setEnabled(false);
                oRow.getCells()[4].setValue("");
                oRow.getCells()[5].setValue("");
                oRow.getCells()[6].setValue("");
                oRow.getCells()[3].setText(Jdata.destinazione);
                oRow.getCells()[3].setEnabled(false);
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
            }
        },
//              - BUTTON DESTINAZIONE
        ModifyBatchDetails: function (event) {
            var oRow;
            if (event) {
                this.ModelLinea.getProperty(event.getSource().getBindingContext("linea").getPath()).modifyBatch = 1;
                this.getView().setModel(this.ModelLinea, "linea");
                oRow = event.getSource().getParent();
            }
            if (!oRow) {
                oRow = this.row;
            }
            var linea_path = oRow.getParent().getBindingContext("linea").sPath;
            this.linea = this.getView().getModel("linea").getProperty(linea_path);
            this.linea_id = this.linea.lineaID;
            this.row = oRow;
            var oView;
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            this.confezione = row_binded.confezione;
            this.grammatura = row_binded.grammatura;
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
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[1].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[3].getText());
                if (!event) {
                    this.getView().byId("formato_SKU").setEnabled(false);
                    this.getView().byId("confezione_SKU").setEnabled(false);
                    this.getView().byId("cliente_SKU").setEnabled(false);
                }
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
                obj.SKUCodiceInterno = "";
                obj.formatoProduttivo = row_binded.formatoProduttivo;
                obj.tipologia = row_binded.confezione;
                obj.grammatura = row_binded.grammatura;
                obj.destinazione = row_binded.destinazione;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU.bind(this), function (error) {
                    console.log(error);
                });
                this.oDialog = oView.byId("modificaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[1].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[3].getText());
                Library.RemoveClosingButtons.bind(this)("attributiContainer");
                this.oDialog.open();
            }
        },
//              - INPUT QLI, CARTONI E ORE
        QLIChanged: function (event) {
            this.ShowUpdateButton(event);
            var ind;
            var obj = sap.ui.getCore().byId(event.getSource().getId());
            var value = obj.getValue();
            if (isNaN(Number(value))) {
                obj.setValue(this.bckupQLI);
                MessageToast.show("Inserire solo numeri", {duration: 3000});
            } else {
                if (Number(value) < 0) {
                    obj.setValue(this.bckupQLI);
                    MessageToast.show("Inserire solo numeri positivi", {duration: 3000});
                } else {
                    ind = 1 + value.indexOf(".") + value.indexOf(",");
                    if ((ind > -1) && ((value.length - ind) > 3)) {
                        obj.setValue(this.bckupQLI);
                        MessageToast.show("Inserire massimo due decimali", {duration: 3000});
                    } else {
                        this.bckupQLI = value;
                        this.ChangeValues(event);
                    }
                }
            }
        },
        CRTChanged: function (event) {
            var obj = sap.ui.getCore().byId(event.getSource().getId());
            var value = obj.getValue();
            if (isNaN(Number(value))) {
                obj.setValue(this.bckupCRT);
                MessageToast.show("Inserire solo numeri interi", {duration: 3000});
            } else {
                if (Number(value) < 0) {
                    obj.setValue(this.bckupCRT);
                    MessageToast.show("Inserire solo numeri interi positivi", {duration: 3000});
                } else {
                    var ind = 1 + value.indexOf(".") + value.indexOf(",");
                    if (ind > -1) {
                        obj.setValue(this.bckupCRT);
                        MessageToast.show("Inserire solo numeri interi positivi", {duration: 3000});
                    } else {
                        this.bckupCRT = value;
                        this.ChangeValues(event);
                    }
                }
            }
            this.ShowUpdateButton(event);
        },
        HOURChanged: function (event) {
            var obj = sap.ui.getCore().byId(event.getSource().getId());
            var value = obj.getValue();
            var hours = Number(value.substring(0, 2));
            var mins = Number(value.substring(3, 5));
            if (hours > 8 || (hours === 8 && mins !== 0)) {
                obj.setValue(this.bckupHOUR);
                MessageToast.show("Non si possono inserire batch da più di 8 ore", {duration: 3000});
            } else {
                this.bckupHOUR = value;
                this.ChangeValues(event);
            }
            this.ShowUpdateButton(event);
        },
        ChangeValues: function (event) {
            this.ShowUpdateButton(event);
            var rowPath = event.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            row_binded.modifyBatch = 1;
            this.pezzi_cartone = row_binded.pezziCartone;
            this.tempo_ciclo = row_binded.secondiPerPezzo;
            var grammatura, numero_pezzi, cartoni, ore, quintali;
            var oValueChanged = event.getParameter("value");
            var oCellChanged = event.getSource();
            var oRow = event.getSource().getParent();
            grammatura = row_binded.grammatura;
            if (oCellChanged === oRow.getCells()[4]) {
                numero_pezzi = (oValueChanged * 100) / (grammatura / 1000);
                cartoni = Math.floor(numero_pezzi / this.pezzi_cartone);
                oRow.getCells()[5].setValue(cartoni);
                ore = Math.floor(numero_pezzi * this.tempo_ciclo);
                oRow.getCells()[6].setValue(Library.SecondsToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[5]) {
                numero_pezzi = oValueChanged * this.pezzi_cartone;
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[4].setValue(Library.roundTo(quintali, 2));
                ore = Math.floor(numero_pezzi * this.tempo_ciclo);
                oRow.getCells()[6].setValue(Library.SecondsToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[6]) {
                numero_pezzi = (Library.standardToMinutes(oValueChanged) * 60) / this.tempo_ciclo;
                cartoni = Math.floor(numero_pezzi / this.pezzi_cartone);
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[4].setValue(Library.roundTo(quintali, 2));
                oRow.getCells()[5].setValue(cartoni);
            }
            this.ModelLinea.refresh();
        },
//              - IMPOSTAZIONI BATCH
        BatchSettings: function (event) {
            this.oButton = event.getSource();
            var Path = this.oButton.getBindingContext("linea").sPath;
            var PathArray = Path.split("/");
            var indexLinea = Number(PathArray[PathArray.indexOf("linee") + 1]);
            this.linea_id = this.ModelLinea.getData().linee[indexLinea].lineaID;
            this.batch_id = this.ModelLinea.getProperty(Path).batchID;
            this.row = event.getSource().getParent().getParent().getParent().getParent();
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/prova.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetMenuFromBatchID2&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
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
            this._menu.setModel(this.prova);
            this._menu.open(this._bKeyboard, this.oButton, eDock.BeginTop, eDock.BeginBottom, this.oButton);
        },
//              - CONFERMA/INSERISCI BATCH
        InsertNewBatch: function (event) {
            var PathLinea = event.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var oRow = event.getSource().getParent().getParent().getParent().getParent().getParent().getParent();
            var rowPath = event.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            var that = this;
            var link;
            var obj = {};
            if (row_binded.batchID) {
                obj.batchId = row_binded.batchID;
            } else {
                obj.batchId = "";
            }
            obj.SKUCodiceInterno = "";
            obj.pianodiconfezionamento = this.pdcID;
            obj.lineaId = this.linea_id;
            obj.formatoProduttivo = oRow.getCells()[1].getValue();
            if (oRow.getCells()[2].getSelectedItem() !== null) {
                obj.grammatura = oRow.getCells()[2].getSelectedItem().getKey();
            } else {
                obj.grammatura = row_binded.grammatura;
            }
            obj.tipologia = row_binded.confezione;
            obj.sequenza = oRow.getCells()[0].getValue();
            obj.destinazione = oRow.getCells()[3].getText();
            obj.quintali = oRow.getCells()[4].getValue();
            obj.cartoni = oRow.getCells()[5].getValue();
            obj.ore = oRow.getCells()[6].getValue();
            if (((Number(obj.quintali) !== 0) && (Number(obj.cartoni) !== 0))) {
                var doc_xml = Library.createXMLBatch(obj);
                if (Number(this.ISLOCAL) === 1) {
                    oRow.getCells()[7].setVisible(false);
                } else {
                    this.rowBinded = row_binded;
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/InsertUpdateBatch&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                    Library.SyncAjaxCallerData(link, function (Jdata) {
                        if (Number(Jdata.error) === 0) {
                            that.rowBinded.modifyBatch = 0;
                            that.RefreshFunction(0, "0");
                        } else {
                            MessageToast.show(Jdata.errorMessage, {duration: 180});
                        }
                    });
                    var path = event.getSource().getBindingContext("linea").sPath.split("/");
                    var index = Number(path[path.indexOf("linee") + 1]);
                    var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
                    AddButton.setEnabled(true);
                }
            } else {
                MessageToast.show("Non si possono inserire batch con zero quintali", {duration: 2000});
            }
        },
//              - ANNULLA CONFERMA/INSERISCI BATCH
        UndoBatchCreation: function (event) {
            this.oButton = event.getSource();
            var Path = event.getSource().getBindingContext("linea").sPath;
            var PathArray = Path.split("/");
            var indexLinea = Number(PathArray[PathArray.indexOf("linee") + 1]);
            this.linea_id = this.ModelLinea.getData().linee[indexLinea].lineaID;
            var row_binded = this.ModelLinea.getProperty(Path);
            var AddButton = this.getView().byId("managePianoTable").getItems()[indexLinea].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
            if (row_binded.batchID && !row_binded.statoBatch) {
                AddButton.setEnabled(true);
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + row_binded.batchID + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
            } else {
                if (row_binded.batchID) {
                    row_binded.modifyBatch = 0;
                } else {
                    this.ModelLinea.getData().linee[indexLinea].batchlist.pop();
                    AddButton.setEnabled(true);
                }
                this.RefreshFunction(0, "0");
            }
        },
//        >>>>>>>>>>>>>>>>>> FUNZIONI DI SUPPORTO <<<<<<<<<<<<<<<<<<

//       ************************ TABELLA 20% DI SINISTRA ************************
        RecursiveTakeAllCause: function (bck) {
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    bck[key] = this.RecursiveTakeAllCause(bck[key]);
                }
            }
            if (bck.fermo !== undefined) {
                this.data_json.cause.push(bck);
            }
            return bck;
        },
//      GESTIONE STILE PULSANTE LINEA
        LineButtonStyle: function () {
            var classes = ["LineaDispo", "LineaNonDispo", "LineaVuota", "LineaAttrezzaggio", "LineaLavorazione", "LineaFermo", "LineaSvuotamento"];
            var data = this.ModelLinea.getData();
            var button;
            var state;
            for (var i = 0; i < data.linee.length; i++) {
                button = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[0];
                for (var k = 0; k < classes.length; k++) {
                    button.removeStyleClass(classes[k]);
                }
                state = data.linee[i].statolinea.split(".");
                switch (state[0]) {
                    case 'Disponibile':
                        button.addStyleClass("LineaDispo");
                        break;
                    case 'NonDisponibile':
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
//       ************************ TABELLA 80% DI DESTRA ************************

        DeleteUncompleteBatches: function () {
            var model = this.ModelLinea.getData().linee;
            var link;
            for (var i = 0; i < model.length; i++) {
                for (var j = 0; j < model[i].batchlist.length; j++) {
                    if (model[i].batchlist[j].batchID && !model[i].batchlist[j].statoBatch) {
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + model[i].batchlist[j].batchID + "&LineaID=" + model[i].lineaID + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
                    }
                }
            }
        },
        //      GESTIONE STILE PULSANTE IMPOSTAZIONI BATCH
        SettingsButtonColor: function () {
            var classes = ["BatchSchedulato", "BatchInAttesa"];
            var data = this.ModelLinea.getData();
            var button;
            for (var i = 0; i < data.linee.length; i++) {
                for (var j = 0; j < data.linee[i].batchlist.length; j++) {
                    button = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[1].getItems()[1].getContent()[0].getItems()[j].getCells()[7].getItems()[0].getItems()[0].getItems()[0];
                    for (var k = 0; k < classes.length; k++) {
                        button.removeStyleClass(classes[k]);
                    }
                    switch (data.linee[i].batchlist[j].statoBatch) {
                        case 'Schedulato':
                            button.addStyleClass("BatchSchedulato");
                            break;
                        default:
                            button.addStyleClass("BatchInAttesa");
                            break;
                    }
                }
            }
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** POPUP MODIFICA ATTRIBUTI BATCH ****************
        TabSelection: function (event) {
            if (event.getParameters().item !== "Attributi") {
                var tabName = event.getParameters().item.getProperty("name");
                if (tabName === "Parametri") {
                    var formatoSKU = this.getView().byId("formato_SKU");
                    var confezioneSKU = this.getView().byId("confezione_SKU");
                    var clienteSKU = this.getView().byId("cliente_SKU");
                    if (formatoSKU.getValue() !== "" && confezioneSKU.getValue() !== "" && clienteSKU.getValue() !== "") {
                        this.BusyDialog.open();
                        var rowPath = this.row.getBindingContext("linea").sPath;
                        var row_binded = this.ModelLinea.getProperty(rowPath);
                        var link;
                        if (row_binded.batchID) {
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchCalcolo&Content-Type=text/json&BatchID=" + row_binded.batchID + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                        } else {
                            var xml = this.BuildXMLForInsertBatch();
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchCalcoloTmp&Content-Type=text/json&xml=" + xml + "&OutputParameter=JSON";
                        }
                        Library.AjaxCallerData(link, this.SUCCESSComboParametri.bind(this));
                    } else {
                        MessageToast.show("Selezionare prima tutti i parametri.", {duration: 3000});
                        var TabContainer = this.getView().byId("attributiContainer");
                        TabContainer.setSelectedItem("Attributi");
                    }
                }
            }
        },
        SUCCESSComboParametri: function (Jdata) {
            var data = Jdata.attributi;
            data = Library.RecursiveLinkRemoval(data);
            data = Library.RecursiveModifyExpansion(data);
            data = Library.RecursiveParentExpansion(data);
            data = Library.RecursivePropertyAdder(data, "valueModify");
            data = Library.RecursivePropertyCopy(data, "valueModify", "value");
            this.TTBackup.setData(data);
            this.ModelParametri.setData(data);
            this.getView().setModel(this.ModelParametri, "ModelParametri");
            var that = this;
            setTimeout(function () {
                that.ShowRelevant(null, "Parametri_TT");
                that.BusyDialog.close();
            }, 100);
        },
        ChangeSKU: function () {
//            var array_confezione;
            if (this.ISLOCAL !== 1) {
//                if (this.getView().byId("confezione_SKU").getSelectedItem() !== null) {
//                    array_confezione = this.getView().byId("confezione_SKU").getSelectedItem().getKey().split(" ");
//                    this.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
//                    this.confezione = array_confezione[0];
//                }
                var obj = {};
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.SKUCodiceInterno = "";
                obj.formatoProduttivo = this.getView().byId("formato_SKU").getValue();
                obj.tipologia = this.confezione;
                obj.grammatura = this.grammatura;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU.bind(this));
            }
        },
        EnableDestinazioni: function () {
            this.grammatura = this.getView().byId("confezione_SKU").getSelectedItem().getKey();
            this.confezione = this.getView().byId("confezione_SKU").getSelectedItem().getText();
            this.getView().byId("cliente_SKU").destroyItems();
            this.getView().byId("cliente_SKU").setValue("");
            this.getView().byId("cliente_SKU").setEnabled(true);
        },
        ResetConfezionamentiDialog: function () {
            var selectBox = this.getView().byId("confezione_SKU");
            selectBox.destroyItems();
            selectBox.setValue("");
            var destinazione = this.getView().byId("cliente_SKU");
            destinazione.destroyItems();
            destinazione.setValue("");
            destinazione.setEnabled(false);
        },
        CaricaDestinazioni: function () {
            var link;
            var that = this;
            var selectBox = this.getView().byId("cliente_SKU");
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllDestinazioniFiltered&Content-Type=text/json&LineaID=" + this.linea_id + "&FormatoProduttivo=" + this.getView().byId("formato_SKU").getValue() + "&Tipologia=" + this.confezione + "&Grammatura=" + this.grammatura + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSDestinazioni.bind(that)(Jdata, selectBox);
            });
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
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
            }
        },
        ConfermaModifiche: function () {
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            var idBatch = "";
            if (row_binded.batchID) {
                idBatch = row_binded.batchID;
            }
            var xmlInsert = this.BuildXMLForInsertBatch();
            var xmlModify = Library.XMLSetupUpdatesCT(this.ModelParametri.getData(), idBatch);
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboInsert_Change&Content-Type=text/json&xmlinsert=" + xmlInsert + "&xmlchange=" + xmlModify + "&OutputParameter=JSON";
            Library.SyncAjaxCallerData(link, this.SUCCESSConfermaModifiche.bind(this));
        },
        SUCCESSConfermaModifiche: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var rowPath = this.row.getBindingContext("linea").sPath;
                var row_binded = this.getView().getModel("linea").getProperty(rowPath);
                row_binded.batchID = Jdata.NewBatchID;
                row_binded.pezziCartone = Jdata.JSONinfo.pezziCartone;
                row_binded.secondiPerPezzo = Jdata.JSONinfo.secondiPerPezzo;
                this.row.getCells()[1].setValue(this.getView().byId("formato_SKU").getValue());
                this.row.getCells()[2].destroyItems();
                this.row.getCells()[2].setValue(this.getView().byId("confezione_SKU").getValue());
                row_binded.confezione = this.confezione;
                row_binded.grammatura = this.grammatura;
                this.row.getCells()[3].setText(this.getView().byId("cliente_SKU").getValue());
                this.row.getCells()[4].setValue("");
                this.row.getCells()[5].setValue("");
                this.row.getCells()[6].setValue("");
                row_binded.SKUCodiceInterno = "";
                this.oDialog.destroy();
                this.ModelLinea.refresh();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        AnnullaModifiche: function () {
            this.RerenderTimePickers();
            this.oDialog.destroy();
            this.ModelLinea.refresh();
        },
        RerenderTimePickers: function () {
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                var oList = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[1].getItems()[1].getContent()[0].getItems();
                for (var j = 0; j < oList.length; j++) {
                    oList[j].getCells()[6].rerender();
                }
            }
        },
        BuildXMLForInsertBatch: function () {
            var formatoSKU = this.getView().byId("formato_SKU");
            var clienteSKU = this.getView().byId("cliente_SKU");
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.ModelLinea.getProperty(rowPath);
            var obj = {};
            if (row_binded.batchID) {
                obj.batchId = row_binded.batchID;
            } else {
                obj.batchId = "";
            }
            obj.formatoProduttivo = formatoSKU.getValue();
            obj.tipologia = this.confezione;
            obj.grammatura = this.grammatura;
            obj.destinazione = clienteSKU.getValue();
            obj.pianodiconfezionamento = this.pdcID;
            obj.lineaId = this.linea_id;
            obj.sequenza = row_binded.sequenza;
            obj.quintali = "";
            obj.cartoni = "";
            obj.ore = "";
            obj.SKUCodiceInterno = "";
            return Library.createXMLBatch(obj);
        },
//      FUNZIONI PER TREETABLE
        CollapseAll: function (event) {
            var View = this.getView().byId(event.getSource().data("mydata"));
            View.collapseAll();
        },
        ExpandAll: function (event, TT) {
            var View;
            if (typeof TT === "undefined") {
                View = this.getView().byId(event.getSource().data("mydata"));
            } else {
                View = this.getView().byId(TT);
            }
            View.expandToLevel(20);
        },
        ShowRelevant: function (event, TT) {
            var View;
            if (typeof TT === "undefined") {
                View = this.getView().byId(event.getSource().data("mydata"));
            } else {
                View = this.getView().byId(TT);
            }
            View.expandToLevel(20);
            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, [View]), 50);
        },
        CollapseNotRelevant: function (Views) {
            var total, temp;
            for (var i = 0; i < Views.length; i++) {
                total = Views[i]._iBindingLength;
                for (var j = total - 1; j >= 0; j--) {
                    if (typeof Views[i].getContextByIndex(j) !== "undefined") {
                        temp = Views[i].getContextByIndex(j).getObject();
                        if (temp.expand === 0) {
                            Views[i].collapse(j);
                        }
                    }
                }
            }
        },
        RestoreDefault: function () {
            var data = JSON.parse(JSON.stringify(this.TTBackup.getData()));
            this.ModelParametri.setData(data);
            this.getView().setModel(this.ModelParametri, "ModelParametri");
        },
        TreeTableRowClickExpander: function (event) {
            var txt, model;
            if (event.getSource().getId().indexOf("SKU_TT") > -1) {
                model = this.ModelSKU;
            } else {
                model = this.ModelParametri;
            }
            var path = event.getParameters().rowBindingContext.sPath;
            var View = this.getView().byId(event.getSource().data("mydata"));
            var clicked_row = event.getParameters().rowIndex;
            var clicked_column = event.getParameters().columnIndex;
            switch (clicked_column) {
                case "0":
                    if (!View.isExpanded(clicked_row)) {
                        View.expand(clicked_row);
                    } else {
                        View.collapse(clicked_row);
                    }
                    break;
                case "1":
                    txt = model.getProperty(path).value;
                    if (txt !== "") {
                        MessageToast.show(txt, {duration: 10000});
                    }
                    break;
                case "2":
                    txt = model.getProperty(path).codeValue;
                    if (txt !== "") {
                        MessageToast.show(txt, {duration: 10000});
                    }
                    break;
            }
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** MENU IMPOSTAZIONI BATCH ****************
        AzioneBatch: function (event) {
            var oText = event.getParameter("item").getText();
            var link;
            switch (oText) {
                case "Visualizza Attributi Batch":
                    this.ShowBatchDetails();
                    break;
                case "Trasferimento schedulato":
                    var Path = this.oButton.getBindingContext("linea").sPath;
                    var qli = this.ModelLinea.getProperty(Path).qli;
                    var cartoni = this.ModelLinea.getProperty(Path).cartoni;
                    if (((Number(qli) !== 0) && (Number(cartoni) !== 0))) {
                        this.BusyDialog.open();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchSchedulato&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSTrasferimentoSchedulato.bind(this));
                    } else {
                        MessageToast.show("Non si possono trasferire batch con zero quintali", {duration: 2000});
                    }
                    break;
                case "Richiamo Batch":
                    this.BusyDialog.open();
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/BatchRichiamo&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSRichiamoBatch.bind(this));
                    break;
                case "Cancellazione Batch":
                    this.BusyDialog.open();
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
                    break;
            }

        },
        ShowBatchDetails: function () {
            var Path = this.oButton.getBindingContext("linea").sPath;
            var pathArray = Path.split("/");
            var linea_path = "/linee/" + pathArray[pathArray.indexOf("linee") + 1] + "/";
            this.linea = this.ModelLinea.getProperty(linea_path);
            this.linea_id = this.linea.lineaID;
            var row_binded = this.ModelLinea.getProperty(Path);
            this.confezione = row_binded.confezione;
            this.grammatura = row_binded.grammatura;
            if (this.ISLOCAL !== 1) {
                var oView = this.getView();
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.SKUCodiceInterno = "";
                obj.formatoProduttivo = row_binded.formatoProduttivo;
                obj.tipologia = row_binded.confezione;
                obj.grammatura = row_binded.grammatura;
                obj.destinazione = row_binded.destinazione;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU.bind(this));
                this.oDialog = oView.byId("visualizzaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.visualizzaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                Library.RemoveClosingButtons.bind(this)("attributiContainer");
                this.oDialog.open();
            }
        },
        SUCCESSTrasferimentoSchedulato: function (Jdata) {
            this.BusyDialog.close();
            if (Number(Jdata.error) === 0) {
                this.RefreshFunction(0, "0");
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 3000});
            }
        },
        SUCCESSRichiamoBatch: function (Jdata) {
            this.BusyDialog.close();
            if (Number(Jdata.error) === 0) {
                this.RefreshFunction(0, "0");
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 120});
            }
        },
        SUCCESSCancellazioneBatch: function (Jdata) {
            this.BusyDialog.close();
            if (Number(Jdata.error) === 0) {
                var Path = this.oButton.getBindingContext("linea").sPath;
                var PathArray = Path.split("/");
                var indexLinea = Number(PathArray[PathArray.indexOf("linee") + 1]);
                var indexBatch = Number(PathArray[PathArray.indexOf("batchlist") + 1]);
                this.ModelLinea.getData().linee[indexLinea].batchlist.splice(indexBatch, 1);
                this.RefreshFunction(0, "0");
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 120});
            }
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** POPUP VISUALIZZA ATTRIBUTI BATCH ****************

        TabSelectionShow: function (event) {
            if (event.getParameters().item !== "Attributi") {
                var tabName = event.getParameters().item.getProperty("name");
                if (tabName === "Parametri") {
                    var rowPath = this.row.getBindingContext("linea").sPath;
                    var row_binded = this.ModelLinea.getProperty(rowPath);
                    var link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchCalcolo&Content-Type=text/json&BatchID=" + row_binded.batchID + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                    this.BusyDialog.open();
                    Library.AjaxCallerData(link, this.SUCCESSComboParametriShow.bind(this));
                }
            }
        },
        SUCCESSComboParametriShow: function (Jdata) {
            var data = Jdata.attributi;
            data = Library.RecursiveLinkRemoval(data);
            this.ModelParametri.setData(data);
            this.getView().setModel(this.ModelParametri, "ModelParametri");
            var that = this;
            setTimeout(function () {
                that.ExpandAll(null, "Parametri_TT");
                that.BusyDialog.close();
            }, 100);
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** POPUP LINEA ****************
        CaricaCausaliDisponibilita: function () {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleNonDisponibilita&Content-Type=text/json&OutputParameter=JSON";
            Library.AjaxCallerData(link, this.SUCCESSCausaliDisponibilita.bind(this));
        },
        SUCCESSCausaliDisponibilita: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                oModel.setData(Jdata);
                var selectBox = this.getView().byId("CausaleNonDisp");
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{causaledisp>id}",
                    text: "{causaledisp>causale}"
                });
                selectBox.setModel(oModel, "causaledisp");
                selectBox.bindAggregation("items", "causaledisp>/causali", oItemSelectTemplate);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
            }
        },
        InserisciFermoProgrammato: function () {
            var causale = this.getView().byId("CausaleNonDisp").getSelectedKey();
            if (causale !== "") {
                var data_inizio = this.SetInizioNonDisponibilita() + "T" + this.getView().byId("InizioNonDisp").getValue() + ":00";
                var data_fine = this.SetFineNonDisponibilita() + "T" + this.getView().byId("FineNonDisp").getValue() + ":00";
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboInsertND_LogND&Content-Type=text/json&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&CausaleID=" + causale + "&datefrom=" + data_inizio + "&dateto=" + data_fine + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, this.SUCCESSInserisciFermoProgrammato.bind(this));
            } else {
                MessageToast.show("Il campo causale è vuoto o errato. Inserire una causale e riprovare", {duration: 2000});
            }
        },
        SUCCESSInserisciFermoProgrammato: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var data;
                data = Library.AddTimeGapsFermiProgrammati(Jdata.logND);
                this.ModelCause.setData(data);
                this.getView().setModel(this.ModelCause, "fermiprogrammati");
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
            }
        },
        CancellaFermoProgrammato: function (event) {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboDeleteND_LogND&Content-Type=text/json&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&LogSchedulatoID=" + event.getSource().getParent().getBindingContext("fermiprogrammati").getObject().LogSchedulatoID + "&OutputParameter=JSON";
            Library.AjaxCallerData(link, this.SUCCESSEliminazioneEffettuata.bind(this));
        },
        SUCCESSEliminazioneEffettuata: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var data;
                data = Library.AddTimeGapsFermiProgrammati(Jdata.logND);
                this.ModelCause.setData(data);
                this.getView().setModel(this.ModelCause, "fermiprogrammati");
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
            }
        },
        RiavviamentoLinea: function () {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/RiavvioNonDisponibilita&Content-Type=text/json&LineaID=" + this.linea_id + "&OutputParameter=JSON";
            Library.AjaxCallerData(link, this.SUCCESSRiavviamentoLinea.bind(this));
        },
        SUCCESSRiavviamentoLinea: function (Jdata) {
            if (Number(Jdata) === 1) {
                MessageToast.show(Jdata.errorMessage, {duration: 3000});
            }
            this.DestroyDialog();
        },
        SetInizioNonDisponibilita: function () {
            var secondi_inizio = Library.fromStandardToSeconds(this.getView().byId("InizioNonDisp").getValue() + ":00");
            var inizio = this.getView().getModel("fermiprogrammati").getData().inizioPdc.split("T")[0];
            var fine = this.getView().getModel("fermiprogrammati").getData().finePdc.split("T")[0];
            if (inizio === fine || secondi_inizio > 21600) {
                return inizio;
            } else {
                return fine;
            }
        },
        SetFineNonDisponibilita: function () {
            var secondi_fine = Library.fromStandardToSeconds(this.getView().byId("FineNonDisp").getValue() + ":00");
            var inizio = this.getView().getModel("fermiprogrammati").getData().inizioPdc.split("T")[0];
            var fine = this.getView().getModel("fermiprogrammati").getData().finePdc.split("T")[0];
            if (inizio === fine || secondi_fine > 21600) {
                return inizio;
            } else {
                return fine;
            }
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** FUNZIONI LOCALI ****************

        LOCALSUCCESSSKUstd: function (Jdata) {
            this.ModelSKUstd.setData(Jdata);
        },
        LOCALSUCCESSDatiOperatore: function (Jdata) {
            this.ModelOperatori.setData(Jdata);
            this.getView().setModel(this.ModelOperatori, 'operatore');
        },
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
    return ManagePianoYellow;
});