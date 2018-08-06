sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/controller/Library',
    'myapp/model/TimeFormatter',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (MessageToast, jQuery, Controller, JSONModel, History, Library, TimeFormatter, Filter, FilterOperator) {
    "use strict";
    var ManagePianoGreen = Controller.extend("myapp.controller.ManagePianoGreen", {

//        VARIABILI GLOBALI
        checkSingoloCausa: null,
        checkTotaleCausa: null,
        ModelGuastiLinea: null,
        ModelGuasti: new JSONModel({}),
        ModelCausali: new JSONModel({}),
        _menu: null,
        guasti: null,
        StabilimentoID: null,
        pdcID: null,
        repartoID: null,
        linea_id: null,
        confezione: null,
        grammatura: null,
        row: null,
        linea: null,
        pezzi_cartone: null, //ARRIVA DA BACKEND 
        tempo_ciclo: null, //ARRIVA DA BACKEND
        TimeFormatter: TimeFormatter,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        data_json: {},
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        ModelMenu: new JSONModel({}),
        ModelLinea: null,
        ModelOperatori: new JSONModel({}),
        ModelSKU: new JSONModel({}),
        ModelParametri: new JSONModel({}),
        ModelSPCData: new JSONModel({}),
        ModelTurni: null,
        ModelSKUstd: new JSONModel({}),
        ModelCause: new JSONModel({}),
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
        STOP: 0,
        STOPLOG: 0,
        STOPSPC: 0,
        oButton: null,
        SPCDialog: null,
        Allarme: null,
        Fase: null,
        ParametroID: null,
        DescrizioneParametro: null,
        Avanzamento: null,
        idLinea: null,
        idBatch: null,
        indexSPC: null,
        pathlinea: null,
        TTBackup: new JSONModel({}),
        STOPCompleta: 0,
        rowBinded: null,
        BusyDialog: new sap.m.BusyDialog(),
        Counter: null,
        RefreshLogCounter: null,
        RefreshCounter: null,
        SPCCounter: null,
        SPCTimer: null,
        bckupSEQ: "",
        bckupQLI: "",
        bckupCRT: "",
        bckupHOUR: "",
        getDialog: null,
        TIMER: null,
//        FUNZIONI D'INIZIALIZZAZIONE
        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePianoGreen").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (event) {
            clearInterval(this.TIMER);
            this.getDialog = sap.ui.getCore().byId("GlobalBusyDialog");
            this.getDialog.close();
            var that = this;
            this.RefreshCounter = 0;
            this.RefreshLogCounter = 10;
            this.Counter = 0;
            this.STOP = 0;
            this.StabilimentoID = sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID;
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").getData().pdc;
            this.repartoID = sap.ui.getCore().getModel("ParametriPiano").getData().reparto;
            this.getView().setModel(sap.ui.getCore().getModel("ParametriPiano"), "ParametriPiano");
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
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&IsRidotta=" + IsRidotta + "&OutputParameter=JSON";
            Library.SyncAjaxCallerData(link, this.RefreshDataSet.bind(this));
        },
        RefreshDataSet: function (Jdata) {
            if (this.ISLOCAL !== 1) {
                if (Jdata.area !== "1") {
                    this.BackToPiani();
                }
                this.pdcID = Jdata.pdcId;
                if (this.STOP === 0) {
                    Jdata = this.BarColorCT(Jdata);
                    this.SPCColorCT(Jdata);
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
            var oldIDs, newIDs, allIDs, j1, j2;
            for (var i = 0; i < newData.length; i++) {
                for (var key in newData[i]) {
                    if (key === "batchlist") {
                        oldIDs = this.GetBatchIDs(oldData[i][key]);
                        newIDs = this.GetBatchIDs(newData[i][key]);
                        allIDs = oldIDs.concat(newIDs);
                        allIDs = allIDs.filter(this.OnlyUnique.bind(this));
                        for (var j = 0; j < allIDs.length; j++) {
                            if (oldIDs.indexOf(allIDs[j]) !== -1 && newIDs.indexOf(allIDs[j]) !== -1) {
                                j1 = this.GetIndex(oldData[i][key], allIDs[j]);
                                j2 = this.GetIndex(newData[i][key], allIDs[j]);
                                if (typeof oldData[i][key][j1].modifyBatch === "undefined" || oldData[i][key][j1].modifyBatch !== 1) {
                                    oldData[i][key][j1] = newData[i][key][j2];
                                }
                            } else if (oldIDs.indexOf(allIDs[j]) !== -1 && newIDs.indexOf(allIDs[j]) === -1) {
                                j1 = this.GetIndex(oldData[i][key], allIDs[j]);
                                if (typeof oldData[i][key][j1].modifyBatch === "undefined" || oldData[i][key][j1].modifyBatch !== 1) {
                                    oldData[i][key].splice(j1, 1);
                                }

                            } else if (oldIDs.indexOf(allIDs[j]) === -1 && newIDs.indexOf(allIDs[j]) !== -1) {
                                j2 = this.GetIndex(newData[i][key], allIDs[j]);
                                oldData[i][key].push(newData[i][key][j2]);
                            } else {
                                console.log("Duuuude that's weird :/");
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
        GetBatchIDs: function (batchlist) {
            var IDs = [];
            for (var i = 0; i < batchlist.length; i++) {
                IDs.push(batchlist[i].batchID);
            }
            return IDs;
        },
        GetIndex: function (batchlist, ID) {
            var index;
            for (var i = 0; i < batchlist.length; i++) {
                if (batchlist[i].batchID === ID) {
                    index = i;
                    break;
                }
            }
            return index;
        },
        OnlyUnique: function (value, index, self) {
            return self.indexOf(value) === index;
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
                AddButton = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
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
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&IsRidotta=0&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, function (Jdata) {
                    that.ModelLinea.setData(Jdata);
                });
                var data = this.ModelLinea.getData();
                data = this.BarColorCT(data);
                this.SPCColorCT(data);
                this.ModelLinea.setData(data);
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
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
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
//        
//         -> PULSANTI SPC CON REFRESH
        SPCGraph: function (event) {
            this.STOPSPC = 0;
            clearInterval(this.SPCTimer);
            this.SPCCounter = 5;
            this.pathLinea = event.getSource().getBindingContext("linea").sPath;
            this.indexSPC = Number(event.getSource().data("mydata"));
            this.idBatch = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].IDbatchAttivo;
            this.idLinea = this.ModelLinea.getProperty(this.pathLinea).lineaID;
            this.ParametroID = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].parametroId;
            this.DescrizioneParametro = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].descrizioneParametro;
            this.SPCDialog = this.getView().byId("SPCWindow");
            if (!this.SPCDialog) {
                this.SPCDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.SPCWindow", this);
                this.getView().addDependent(this.SPCDialog);
            }
            this.SPCDialog.open();
            this.SPCDataCaller();
            var that = this;
            this.SPCTimer = setInterval(function () {
                try {
                    that.SPCCounter++;
                    if (that.STOPSPC === 0 && that.SPCCounter >= 5) {
                        that.SPCRefresh();
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        },
        SUCCESSSPCDataLoad: function (Jdata) {
            var isEmpty;
            this.Allarme = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].allarme;
            this.Fase = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].fase;
            this.Avanzamento = this.ModelLinea.getProperty(this.pathLinea).SPC[this.indexSPC].avanzamento;
            if (Jdata.valori === "") {
                isEmpty = 1;
            } else {
                isEmpty = 0;
                Jdata = this.ParseSPCData(Jdata, "#");
                if (this.Fase === "1") {
                    Jdata = this.Phase1(Jdata);
                }
                this.ModelSPCData.setProperty("/", Jdata);
            }
            this.SPCDialogFiller(isEmpty);
            if (this.STOPSPC === 0) {
                this.SPCCounter = 0;
            }
        },
        SPCRefresh: function (msec) {
            this.SPCCounter = 0;
            if (typeof msec === "undefined") {
                msec = 0;
            }
            setTimeout(this.SPCDataCaller.bind(this), msec);
        },
        SPCDataCaller: function () {
            if (this.SPCDialog) {
                if (this.SPCDialog.isOpen()) {
                    var link;
                    if (this.ISLOCAL === 1) {
                        link = "model/JSON_SPCData.json";
                    } else {
                        if (typeof this.ParametroID !== "undefined") {
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/SPCDataPlot&Content-Type=text/json&OutputParameter=JSON&LineaID=" + this.idLinea + "&ParametroID=" + this.ParametroID;
                        }
                    }
                    Library.SyncAjaxCallerData(link, this.SUCCESSSPCDataLoad.bind(this));
                }
            }
        },
//         -> PULSANTE AGGIUNTA BATCH
        AddBatch: function (event) {
            var path = event.getSource().getBindingContext("linea").sPath.split("/");
            var index = Number(path[path.indexOf("linee") + 1]);
            var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
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
            this.ShowUpdateButton(event);
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
        },
        ShowUpdateButton: function (event) {
            var rowPath = event.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            row_binded.modifyBatch = 1;
            this.ModelLinea.refresh();
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
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
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
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
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
            this.ShowUpdateButton(event);
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
        },
        HOURChanged: function (event) {
            this.ShowUpdateButton(event);
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
//            if (!this._menu) {
            this._menu = sap.ui.xmlfragment(
                    "myapp.view.MenuItemEventing",
                    this
                    );
            this.getView().addDependent(this._menu);
//            }
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
                    this.BusyDialog.open();
                    this.rowBinded = row_binded;
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/InsertUpdateBatch&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                    Library.SyncAjaxCallerData(link, function (Jdata) {
                        if (Number(Jdata.error) === 0) {
                            that.rowBinded.modifyBatch = 0;
                            that.RefreshFunction(0, "0");
                        } else {
                            MessageToast.show(Jdata.errorMessage, {duration: 2000});
                        }
                    }, function (err) {
                        console.log(err);
                    });
                    var path = event.getSource().getBindingContext("linea").sPath.split("/");
                    var index = Number(path[path.indexOf("linee") + 1]);
                    var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
                    AddButton.setEnabled(true);
                    this.ModelLinea.refresh();
                    this.BusyDialog.close();
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
            var AddButton = this.getView().byId("managePianoTable").getItems()[indexLinea].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[3].getItems()[0];
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
            this.ModelLinea.refresh();
            this.BusyDialog.close();
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
        SplitId: function (id, string) {
            var splitter = id.indexOf(string);
            var root = id.substring(0, splitter);
            var real_id = id.substring(splitter, id.length);
            var index = id.substring(splitter + string.length, id.length);
            return [root, real_id, index];
        },
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
//      FUNZIONI SPC    
        SPCDialogFiller: function (discr) {
            var textHeader = this.getView().byId("headerSPCWindow");
            textHeader.setText(String(this.DescrizioneParametro));
            var samplingHeader = this.getView().byId("samplingSPC");
            if (Number(this.Fase) === 1) {
                samplingHeader.setText("Campionamento in corso: " + String(this.Avanzamento) + "/50");
            } else {
                samplingHeader.setText("");
            }
            if (discr !== 1) {
                var plotBox = this.getView().byId("plotBox");
                var alarmButton = this.getView().byId("alarmButton");
                if (Number(this.Fase) === 2 && Number(this.Allarme) === 1) {
                    alarmButton.setEnabled(true);
                    alarmButton.removeStyleClass("chiudiButton");
                    alarmButton.addStyleClass("allarmeButton");
                } else {
                    alarmButton.setEnabled(false);
                    alarmButton.removeStyleClass("allarmeButton");
                    alarmButton.addStyleClass("chiudiButton");
                }
                if (!((Number(this.Fase) === 1) && (this.ModelSPCData.getData().valori.length < 50))) {
                    var data = this.ModelSPCData.getData();
                    var result = this.PrepareDataToPlot(data, this.Fase);
                    var ID = jQuery.sap.byId(plotBox.getId()).get(0);
                    Plotly.newPlot(ID, result.dataPlot, result.layout);
                }
            }
        },
        RemoveAlarm: function () {
            this.STOPSPC = 1;
            clearInterval(this.SPCTimer);
            var alarmButton = this.getView().byId("alarmButton");
            alarmButton.setEnabled(false);
            alarmButton.removeStyleClass("allarmeButton");
            alarmButton.addStyleClass("chiudiButton");
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ResetSPCAlarm&Content-Type=text/json&BatchID=" + this.idBatch + "&ParametroID=" + this.ParametroID;
            Library.AjaxCallerVoid(link, this.RefreshFunction.bind(this));
            this.CloseSPCDialog();
        },
        CloseSPCDialog: function () {
            this.STOPSPC = 1;
            clearInterval(this.SPCTimer);
            this.SPCDialog.close();
        },
        ParseSPCData: function (data, char) {
            for (var key in data) {
                data[key] = data[key].split(char);
                for (var i = data[key].length - 1; i >= 0; i--) {
                    if (data[key][i] === "") {
                        data[key].splice(i, 1);
                    } else {
                        if (key !== "time") {
                            data[key][i] = Number(data[key][i]);
                        }
                    }
                }
            }
            return data;
        },
        Phase1: function (data) {
            data.MR = [];
            var avg = 0;
            var i, temp;
            data.MR.push(0);
            for (i = 0; i < data.valori.length - 1; i++) {
                temp = Math.abs(data.valori[i + 1] - data.valori[i]);
                data.MR.push(temp);
                avg += temp;
            }
            avg /= (data.MR.length);
            data.MRBound = [];
            for (i = 0; i < data.MR.length; i++) {
                data.MRBound.push(3.267 * avg);
            }
            data.MRTime = JSON.parse(JSON.stringify(data.time));
            return data;
        },
        PrepareDataToPlot: function (Jdata, fase) {
            var dataPlot, layout;
            var valori = {
                x: Jdata.time,
                y: Jdata.valori,
                type: 'scatter',
                line: {color: 'rgb(0,58,107)', width: 1}
            };
            var limSup = {
                x: Jdata.time,
                y: Jdata.limSup,
                type: 'scatter',
                line: {color: 'rgb(167,25,48)', width: 1}
            };
            var limInf = {
                x: Jdata.time,
                y: Jdata.limInf,
                type: 'scatter',
                line: {color: 'rgb(167,25,48)', width: 1}
            };
            dataPlot = [valori, limSup, limInf];
            layout = {
                showlegend: false,
                autosize: true,
                xaxis: {
                    showgrid: true,
                    zeroline: false
                },
                yaxis: {
                    showgrid: true,
                    zeroline: false
                }
            };
            if (fase === "1") {
                var MR = {
                    x: Jdata.MRTime,
                    y: Jdata.MR,
                    xaxis: 'x2',
                    yaxis: 'y2',
                    type: 'scatter',
                    line: {color: 'rgb(0,58,107)', width: 1}
                };
                var MRBound = {
                    x: Jdata.MRTime,
                    y: Jdata.MRBound,
                    xaxis: 'x2',
                    yaxis: 'y2',
                    type: 'scatter',
                    line: {color: 'rgb(167,25,48)', width: 1}
                };
                dataPlot.push(MR);
                dataPlot.push(MRBound);
                layout.yaxis.domain = [0.6, 1];
                layout.xaxis2 = {};
                layout.yaxis2 = {};
                layout.xaxis2.anchor = "y2";
                layout.yaxis2.domain = [0, 0.4];
            } else {
                if (Number(this.Allarme) === 0) {
                    layout.xaxis.linecolor = "rgb(124,162,149)";
                    layout.yaxis.linecolor = "rgb(124,162,149)";
                } else {
                    layout.xaxis.linecolor = "rgb(255,211,0)";
                    layout.yaxis.linecolor = "rgb(255,211,0)";
                }
                layout.xaxis.linewidth = 4;
                layout.xaxis.mirror = true;
                layout.yaxis.linewidth = 4;
                layout.yaxis.mirror = true;
            }
            return {dataPlot: dataPlot, layout: layout};
        },
//      GESTIONE STILE PROGRESS BAR        
        BarColorCT: function (data) {
            var progressBar;
            if (data.linee.length > 0) {
                for (var i = 0; i < data.linee.length; i++) {
                    if (Number(data.linee[i].avanzamento) >= 100) {
                        data.linee[i].avanzamento = 100;
                    } else {
                        data.linee[i].avanzamento = Number(data.linee[i].avanzamento);
                    }
                    progressBar = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[0];
                    switch (data.linee[i].barColor) {
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
                    if (data.linee[i].statolinea === "Disponibile.Fermo" || data.linee[i].statolinea === "Disponibile.Svuotamento") {
                        progressBar.setState("None");
                    }
                }
            }
            return data;
        },
//      GESTIONE STILE SPC
        SPCColorCT: function (data) {
            var CSS_classesButton = ["SPCButtonColorGreen", "SPCButtonColorYellow", "SPCButtonPhase1", "SPCButtonContent", "DualSPCButtonContent", "SPCButtonEmpty"];
            var SPCButton;
            if (data.linee.length > 0) {
                for (var i = 0; i < data.linee.length; i++) {
                    for (var j = 0; j < data.linee[i].SPC.length; j++) {
                        SPCButton = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[j + 1].getItems()[0];
                        for (var k = 0; k < CSS_classesButton.length; k++) {
                            SPCButton.removeStyleClass(CSS_classesButton[k]);
                        }
                        var discr = "";
                        if (data.linee[i].statolinea === "Disponibile.Lavorazione") {
                            if (data.linee[i].SPC[j].fase === "1") {
                                discr = "1";
                            } else if (data.linee[i].SPC[j].fase === "2") {
                                discr = "2";
                            }
                        }
                        switch (discr) {
                            case "1":
                                SPCButton.setEnabled(true);
                                if (SPCButton.getIcon() !== "img/triangolo_buco.png") {
                                    SPCButton.setIcon("img/triangolo_buco.png");
                                }
                                SPCButton.setText(data.linee[i].SPC[j].numeroCampionamenti);
                                SPCButton.addStyleClass("SPCButtonPhase1");
                                SPCButton.addStyleClass("SPCButtonColorYellow");
                                break;
                            case "2":
                                SPCButton.setEnabled(true);
                                SPCButton.setIcon("");
                                SPCButton.setText("");
                                if (data.linee[i].SPC[j].allarme === "0") {
                                    SPCButton.addStyleClass("SPCButtonColorGreen");
                                } else if (data.linee[i].SPC[j].allarme === "1") {
                                    SPCButton.addStyleClass("SPCButtonColorYellow");
                                }
                                break;
                            default:
                                SPCButton.setText("");
                                SPCButton.addStyleClass("SPCButtonEmpty");
                                SPCButton.setIcon("");
                                SPCButton.setEnabled(false);
                                break;
                        }
                    }
                }
            }
        },
//      GESTIONE STILE PULSANTE IMPOSTAZIONI BATCH
        SettingsButtonColor: function () {
            var classes = ["BatchInMacchina", "BatchInAttesa", "BatchTrasferito"];
            var data = this.ModelLinea.getData();
            var button;
            for (var i = 0; i < data.linee.length; i++) {
                for (var j = 0; j < data.linee[i].batchlist.length; j++) {
                    button = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0].getItems()[j].getCells()[7].getItems()[0].getItems()[0].getItems()[0];
                    for (var k = 0; k < classes.length; k++) {
                        button.removeStyleClass(classes[k]);
                    }
                    switch (data.linee[i].batchlist[j].statoBatch) {
                        case 'In lavorazione':
                        case 'Attrezzaggio':
                            button.addStyleClass("BatchInMacchina");
                            break;
                        case 'Attesa presa in carico':
                            button.addStyleClass("BatchTrasferito");
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
            if (this.ISLOCAL !== 1) {
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
                this.RerenderTimePickers();
                this.oDialog.destroy();
                this.ModelLinea.refresh();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
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
                var oList = oTables[i].getCells()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[1].getContent()[0].getItems();
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
                for (var j = total - 1; j > 0; j--) {
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
            var link, qli, cartoni, Path;
            switch (oText) {
                case "Visualizza Attributi Batch":
                    this.ShowBatchDetails();
                    break;
                case "Trasferimento Batch a Linea":
                    Path = this.oButton.getBindingContext("linea").sPath;
                    qli = this.ModelLinea.getProperty(Path).qli;
                    cartoni = this.ModelLinea.getProperty(Path).cartoni;
                    if (((Number(qli) !== 0) && (Number(cartoni) !== 0))) {
                        this.BusyDialog.open();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboTrasferimento&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSTrasferimentoBatch.bind(this));
                    } else {
                        MessageToast.show("Non si possono trasferire batch con zero quintali", {duration: 2000});
                    }
                    break;
                case "Trasferimento Batch a Linea (solo attrezzaggio)":
                    Path = this.oButton.getBindingContext("linea").sPath;
                    qli = this.ModelLinea.getProperty(Path).qli;
                    cartoni = this.ModelLinea.getProperty(Path).cartoni;
                    if (((Number(qli) !== 0) && (Number(cartoni) !== 0))) {
                        this.BusyDialog.open();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboTrasferimentoPredisposizione&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSTrasferimentoBatchAttrezzaggio.bind(this));
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
                case "Gestione Intervalli di Fermo":
                    this.STOP = 1;
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiFromBatchID&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSGestioneFermi.bind(this));
                    break;
                case "Causalizzazione Fermi Automatici":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausaFromBatchID&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSGuasti.bind(this));
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
        SUCCESSTrasferimentoBatch: function (Jdata) {
            this.BusyDialog.close();
            this.ModelLinea.setData(Jdata);
            this.getView().setModel(this.ModelLinea, "linea");
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            this.RefreshFunction(0, "0");
        },
        SUCCESSTrasferimentoBatchAttrezzaggio: function (Jdata) {
            this.BusyDialog.close();
            this.ModelLinea.setData(Jdata);
            this.getView().setModel(this.ModelLinea, "linea");
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            this.RefreshFunction(0, "0");
        },
        SUCCESSRichiamoBatch: function (Jdata) {
            this.BusyDialog.close();
            if (Number(Jdata.error) === 0) {
                this.RefreshFunction(0, "0");
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 3000});
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
        SUCCESSGestioneFermi: function (Jdata) {
            Jdata = Library.AddTimeGaps(Jdata);
            this.ModelGuasti.setData(Jdata);
            this.getView().setModel(this.ModelGuasti, "guasti");
            this.oDialog = this.getView().byId("GestioneIntervalliFermo");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(this.getView().getId(), "myapp.view.GestioneIntervalliFermo", this);
                this.getView().addDependent(this.oDialog);
            }
            this.oDialog.open();
        },
        SUCCESSGuasti: function (Jdata) {
            this.CheckSingoloCausa = [];
            Jdata = Library.AddTimeGaps(Jdata);
            this.ModelGuastiLinea = new JSONModel({});
            this.ModelGuastiLinea.setData(Jdata);
            for (var j in Jdata.fermi) {
                this.CheckSingoloCausa.push(0);
                Jdata.fermi[j].selected = false;
            }
            this.ModelGuastiLinea = new JSONModel({});
            this.ModelGuastiLinea.setData(Jdata);
            var oView = this.getView();
            oView.setModel(this.ModelGuastiLinea, "guastilinea");
            this.oDialog = oView.byId("CausalizzazioneFermo");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermo", this);
                oView.addDependent(this.oDialog);
            }
            var tempo_totale = Jdata.Totale.tempoGuastoTotale;
            this.getView().byId("ConfermaFermi").setEnabled(false);
            var oTable = this.getView().byId("TotaleTable");
            if (tempo_totale === "00:00:00") {
                oTable.getItems()[0].getCells()[3].setVisible(false);
            } else {
                oTable.getItems()[0].getCells()[3].setVisible(true);
            }
            oTable.getItems()[0].getCells()[3].setSelected(false);
            this.CheckTotaleCausa = 0;
            this.oDialog.open();
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
//      **************** POPUP GESTIONE INTERVALLI DI FERMO ****************
//        -> PULSANTE DI AGGIUNTA DEL FERMO
        AggiungiFermo: function () {
            var link;
            var that = this;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermoPiatta&Content-Type=text/json&OutputParameter=JSON&IsManuale=1";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.ModelCausali.setData(Jdata);
                that.getView().setModel(that.ModelCausali, "cause");
                that.CreaFinestraInserimento("Inserisci Fermo");
            });
        },
        OpenMenuCausalizzazione: function (event) {
            this.oButton = event.getSource();
            var link;
            this.row = this.oButton.getParent().getBindingContext("guasti").getObject();
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermoPiatta&Content-Type=text/json&OutputParameter=JSON&IsManuale=" + this.row.isManuale;
            }
            Library.AjaxCallerData(link, this.SUCCESSCausali.bind(this));
        },
        SUCCESSCausali: function (Jdata) {
            this.ModelCausali.setData(Jdata);
            this.getView().setModel(this.ModelCausali, "cause");
            this._menu = sap.ui.xmlfragment(
                    "myapp.view.MenuCausalizzazione",
                    this
                    );
            var items = this._menu.getItems();
            for (var i = 0; i < items.length; i++) {
                if (this.row.isAttivo === "1" && i !== 1 && i !== 3) {
                    items[i].setEnabled(false);
                } else {
                    items[i].setEnabled(true);
                }
            }
            this.getView().addDependent(this._menu);
            var eDock = sap.ui.core.Popup.Dock;
            this._menu.open(this._bKeyboard, this.Button, eDock.EndTop, eDock.BeginBottom, this.oButton);
        },
        ModificaGuasti: function (event) {
            var oText = event.getParameter("item").getText();
            switch (oText) {
                case "Modifica Causale Fermo":
                    this.CreaFinestraModificaCausale(oText);
                    break;
                case "Modifica Inizio/Fine del Fermo":
                    this.CreaFinestraModificaTempi(oText);
                    break;
                case "Fraziona Causale di Fermo":
                    this.CreaFinestraFrazionamento(oText);
                    break;
                case "Elimina Fermo":
                    this.CreaFinestraEliminazione(oText);
                    break;
                case "Inserisci Fermo":
                    this.CreaFinestraInserimento(oText);
            }
        },
//      **************** POPUP GESTIONE INTERVALLI MODIFICA CAUSALE ****************        
        CreaFinestraModificaCausale: function (text) {
            var oView = this.getView();
            this.oDialog = oView.byId("modificaGuasti");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
                oView.addDependent(this.oDialog);
            }
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var topBox = oView.byId("topBox");
            var oVBox1 = topBox.getItems()[0];
            var oVBox2 = topBox.getItems()[1];
            var oText1 = new sap.m.Text({
                text: "Valore Corrente"
            });
            var oText2 = new sap.m.Text({
                text: this.row.causale
            });
            var bottomBox = oView.byId("bottomBox");
            var bBox1 = bottomBox.getItems()[0];
            var bBox2 = bottomBox.getItems()[1];
            var bText1 = new sap.m.Text({
                text: "Nuovo Valore"
            });
            var selectMenu = new sap.m.Select({
                autoAdjustWidth: true,
                id: "selectionMenu"
            });
            var oItemSelectTemplate = new sap.ui.core.Item({
                key: "{cause>id}",
                text: "{cause>fermo}"
            });
            selectMenu.setModel(this.getView().getModel("cause"));
            selectMenu.bindAggregation("items", "cause>/causali", oItemSelectTemplate);
            selectMenu.addStyleClass("myListItemRed");
            bText1.addStyleClass("red");
            topBox.addStyleClass("blackBorder");
            oText2.addStyleClass("size1");
            oVBox1.addItem(oText1);
            oVBox2.addItem(oText2);
            bBox1.addItem(bText1);
            bBox2.addItem(selectMenu);
            this.oDialog.open();
        },
//      **************** POPUP GESTIONE INTERVALLI MODIFICA TEMPI ****************  
        CreaFinestraModificaTempi: function (text) {
            var oView = this.getView();
            this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
            oView.addDependent(this.oDialog);
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var topBox = oView.byId("topBox");
            var oVBox1 = topBox.getItems()[0];
            var oVBox2 = topBox.getItems()[1];
            var oText1 = new sap.m.Text({
                text: "Valore Corrente"
            });
            oVBox1.addItem(oText1);
            var oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            var oHBox1 = new sap.m.HBox({
                width: "50%"
            });
            var oHBox2 = new sap.m.HBox({
                width: "50%"
            });
            var oText2 = new sap.m.Text({
                text: "inizio"
            });
            var oText3 = new sap.m.Text({
                text: "fine"
            });
            var oTextFine = new sap.m.Text({
                text: this.row.fine
            });
            var oTextInizio = new sap.m.Text({
                text: this.row.inizio
            });
            oText2.addStyleClass("size1 sapUiSmallMarginEnd sapUiTinyMarginTop");
            oText3.addStyleClass("size1 sapUiSmallMarginEnd sapUiTinyMarginTop");
            oTextInizio.addStyleClass("size1 tempoBox");
            oTextFine.addStyleClass("size1 tempoBox");
            oHBox1.addItem(oText2);
            oHBox1.addItem(oTextInizio);
            oHBox2.addItem(oText3);
            oHBox2.addItem(oTextFine);
            oHBoxTop.addItem(oHBox1);
            oHBoxTop.addItem(oHBox2);
            oVBox2.addItem(oHBoxTop);
            topBox.addStyleClass("blackBorder");
            var bottomBox = oView.byId("bottomBox");
            oVBox1 = bottomBox.getItems()[0];
            oVBox2 = bottomBox.getItems()[1];
            var oText = new sap.m.Text({
                text: "Nuovi Valori"
            });
            oText.addStyleClass("red");
            oVBox1.addItem(oText);
            var oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            oHBox1 = new sap.m.HBox({
                width: "50%"
            });
            oHBox2 = new sap.m.HBox({
                width: "50%"
            });
            oText1 = new sap.m.Text({
                text: "inizio"
            });
            oText2 = new sap.m.Text({
                text: "fine"
            });
            oTextFine = new sap.m.TimePicker({
                localeId: "it_IT",
                value: this.row.fine,
                id: "Fine"
            });
            oTextInizio = new sap.m.TimePicker({
                localeId: "it_IT",
                value: this.row.inizio,
                id: "Inizio"
            });
            oText1.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oText2.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oTextInizio.addStyleClass("myRedTempoBox");
            oTextFine.addStyleClass("myRedTempoBox");
            oHBox1.addItem(oText1);
            oHBox1.addItem(oTextInizio);
            oHBox2.addItem(oText2);
            oHBox2.addItem(oTextFine);
            oHBoxBottom.addItem(oHBox1);
            oHBoxBottom.addItem(oHBox2);
            oVBox2.addItem(oHBoxBottom);
            this.oDialog.open();
        },
//      **************** POPUP GESTIONE INTERVALLI FRAZIONAMENTO **************** 
        CreaFinestraFrazionamento: function (text) {
            var oView = this.getView();
            this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
            oView.addDependent(this.oDialog);
            //title e top box
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var topBox = oView.byId("topBox");
            var oVBox = topBox.getItems()[1];
            var oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            var oText1 = new sap.m.Text({
                text: "inizio"
            });
            var oTextInizio = new sap.m.Text({
                text: this.row.inizio
            });
            oText1.addStyleClass("size1 sapUiSmallMarginEnd sapUiTinyMarginTop");
            oTextInizio.addStyleClass("size1 tempoBox");
            oHBoxTop.addItem(oText1);
            oHBoxTop.addItem(oTextInizio);
            oVBox.addItem(oHBoxTop);
            topBox.addStyleClass("blackBorder");
            //bottom box
            var bottomBox = oView.byId("bottomBox");
            oVBox = bottomBox.getItems()[1];
            var oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            oText1 = new sap.m.Text({
                text: "fine"
            });
            var oTextFine = new sap.m.Text({
                text: this.row.fine
            });
            oText1.addStyleClass("size1 sapUiMediumMarginEnd sapUiTinyMarginTop");
            oTextFine.addStyleClass("size1 tempoBox");
            oHBoxBottom.addItem(oText1);
            oHBoxBottom.addItem(oTextFine);
            oVBox.addItem(oHBoxBottom);
            //central box
            var centralBox = oView.byId("centralBox");
            oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxCentral = new sap.m.HBox({
                width: "100%"
            });
            oText1 = new sap.m.Text({
                text: "inizio"
            });
            oTextInizio = new sap.m.TimePicker({
                localeId: "it_IT",
                value: this.row.inizio,
                id: "Inizio"
            });
            oText1.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oTextInizio.addStyleClass("myRedTempoBox");
            oHBoxTop.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxTop.addItem(oText1);
            oHBoxTop.addItem(oTextInizio);
            centralBox.addItem(oHBoxTop);
            oText1 = new sap.m.Text({
                text: "causale"
            });
            var selectMenu = new sap.m.Select({
                autoAdjustWidth: true,
                id: "selectionMenu"
            });
            var oItemSelectTemplate = new sap.ui.core.Item({
                key: "{cause>id}",
                text: "{cause>fermo}"
            });
            selectMenu.setModel(this.getView().getModel("cause"));
            selectMenu.bindAggregation("items", "cause>/causali", oItemSelectTemplate);
            selectMenu.addStyleClass("myListItemRed");
            oText1.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oHBoxCentral.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxCentral.addItem(oText1);
            oHBoxCentral.addItem(selectMenu);
            centralBox.addItem(oHBoxCentral);
            oText1 = new sap.m.Text({
                text: "fine"
            });
            oTextFine = new sap.m.TimePicker({
                localeId: "it_IT",
                value: this.row.fine,
                id: "Fine"
            });
            oText1.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oTextFine.addStyleClass("myRedTempoBox");
            oHBoxBottom.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxBottom.addItem(oText1);
            oHBoxBottom.addItem(oTextFine);
            centralBox.addStyleClass("blackBorder sapUiSmallMargin");
            centralBox.addItem(oHBoxBottom);
            this.oDialog.open();
        },
//      **************** POPUP GESTIONE INTERVALLI ELIMINAZIONE **************** 
        CreaFinestraEliminazione: function (text) {
            var oView = this.getView();
            this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
            oView.addDependent(this.oDialog);
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var centralBox = oView.byId("centralBox");
            var oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxCentral = new sap.m.HBox({
                width: "100%"
            });
            var oText = new sap.m.Text({
                text: "inizio"
            });
            var oTextInizio = new sap.m.TimePicker({
                localeId: "it_IT",
                value: this.row.inizio,
                id: "Inizio",
                enabled: false
            });
            oText.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oTextInizio.addStyleClass("myRedTempoBox noOpacity");
            oHBoxTop.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxTop.addItem(oText);
            oHBoxTop.addItem(oTextInizio);
            centralBox.addItem(oHBoxTop);
            oText = new sap.m.Text({
                text: "causale"
            });
            var Causale = new sap.m.Text({
                id: "Causale",
                text: this.row.causale
            });
            if (this.row.causale === "") {
                Causale.setVisible(false);
            } else {
                Causale.addStyleClass("size1 sapUiSmallMarginEnd sapUiTinyMarginTop red tempoBox");
            }
            oText.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oHBoxCentral.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxCentral.addItem(oText);
            oHBoxCentral.addItem(Causale);
            centralBox.addItem(oHBoxCentral);
            oText = new sap.m.Text({
                text: "fine"
            });
            var oTextFine = new sap.m.TimePicker({
                localeId: "it_IT",
                value: this.row.fine,
                id: "Fine",
                enabled: false
            });
            oText.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oTextFine.addStyleClass("myRedTempoBox noOpacity");
            oHBoxBottom.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxBottom.addItem(oText);
            oHBoxBottom.addItem(oTextFine);
            centralBox.addItem(oHBoxBottom);
            this.oDialog.open();
        },
//      **************** POPUP GESTIONE INTERVALLI INSERIMENTO **************** 
        CreaFinestraInserimento: function (text) {
            var oView = this.getView();
            this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
            oView.addDependent(this.oDialog);
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var centralBox = oView.byId("centralBox");
            var oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxCentral = new sap.m.HBox({
                width: "100%"
            });
            var oText = new sap.m.Text({
                text: "inizio"
            });
            var oTextInizio = new sap.m.TimePicker({
                localeId: "it_IT",
                value: "00:00:00",
                id: "Inizio"
            });
            oText.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oTextInizio.addStyleClass("myRedTempoBox");
            oHBoxTop.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxTop.addItem(oText);
            oHBoxTop.addItem(oTextInizio);
            centralBox.addItem(oHBoxTop);
            oText = new sap.m.Text({
                text: "causale"
            });
            var selectMenu = new sap.m.Select({
                autoAdjustWidth: true,
                id: "selectionMenu"
            });
            var oItemSelectTemplate = new sap.ui.core.Item({
                key: "{cause>id}",
                text: "{cause>fermo}"
            });
            selectMenu.setModel(this.getView().getModel("cause"));
            selectMenu.bindAggregation("items", "cause>/causali", oItemSelectTemplate);
            selectMenu.addStyleClass("myListItemRed");
            oText.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oHBoxCentral.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxCentral.addItem(oText);
            oHBoxCentral.addItem(selectMenu);
            centralBox.addItem(oHBoxCentral);
            oText = new sap.m.Text({
                text: "fine"
            });
            var oTextFine = new sap.m.TimePicker({
                localeId: "it_IT",
                value: "00:00:00",
                id: "Fine"
            });
            oText.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oTextFine.addStyleClass("myRedTempoBox");
            oHBoxBottom.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxBottom.addItem(oText);
            oHBoxBottom.addItem(oTextFine);
            centralBox.addStyleClass("sapUiSmallMargin");
            centralBox.addItem(oHBoxBottom);
            this.oDialog.open();
        },
//      **************** POPUP GESTIONE INTERVALLI AZIONI DI CONFERMA E DI ANNULLA **************** 
        DestroyDialog: function () {
            clearInterval(this.NDTIMER);
            this.BusyDialog.close();
            this.STOPLOG = 1;
            this.oDialog.destroy();
            this.RerenderTimePickers();
            this.oDialog = this.getView().byId("GestioneIntervalliFermo");
            this.ModelLinea.refresh();
        },
        ConfermaCambio: function (event) {
            var oText = this.getView().byId("title").getText();
            var obj, link, data_inizio, data_fine;
            switch (oText) {
                case "Modifica Causale Fermo":
                    if (this.ISLOCAL === 1) {
                        this.LOCALModificaCausaleFermo(event);
                        this.oDialog.destroy();
                    } else {
                        obj = {};
                        obj.caso = "updateCausale";
                        obj.logId = this.row.LogID;
                        obj.batchId = this.row.batchID;
                        obj.dataFine = "";
                        obj.dataInizio = "";
                        obj.causaleId = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermiAttivo_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSGuastoModificato.bind(this), function (error) {
                            console.log(error);
                        });
                    }
                    break;
                case "Modifica Inizio/Fine del Fermo":
                    if (this.ISLOCAL === 1) {
                        this.LOCALModificaTempiFermo();
                        this.oDialog.destroy();
                    } else {
                        data_inizio = this.SetDataIniziale();
                        data_fine = this.SetDataFinale();
                        obj = {};
                        obj.caso = "updateInizioFine";
                        obj.logId = this.row.LogID;
                        obj.batchId = this.row.batchID;
                        obj.dataFine = data_fine + 'T' + sap.ui.getCore().byId("Fine").getValue();
                        obj.dataInizio = data_inizio + 'T' + sap.ui.getCore().byId("Inizio").getValue();
                        obj.causaleId = "";
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermiAttivo_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSGuastoModificato.bind(this));
                    }
                    break;
                case "Fraziona Causale di Fermo":
                    if (this.ISLOCAL === 1) {
                        this.LOCALFrazionaFermo();
                        this.oDialog.destroy();
                    } else {
                        data_inizio = this.SetDataIniziale();
                        data_fine = this.SetDataFinale();
                        obj = {};
                        obj.caso = "divide";
                        obj.logId = this.row.LogID;
                        obj.batchId = this.row.batchID;
                        obj.dataFine = data_fine + 'T' + sap.ui.getCore().byId("Fine").getValue();
                        obj.dataInizio = data_inizio + 'T' + sap.ui.getCore().byId("Inizio").getValue();
                        obj.causaleId = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermiAttivo_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSGuastoModificato.bind(this));
                    }
                    break;
                case "Elimina Fermo":
                    if (this.ISLOCAL === 1) {
                        this.LOCALEliminaFermo();
                        this.oDialog.destroy();
                    } else {
                        obj = {};
                        obj.caso = "delete";
                        obj.logId = this.row.LogID;
                        obj.batchId = this.row.batchID;
                        obj.dataFine = "";
                        obj.dataInizio = "";
                        obj.causaleId = "";
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermiAttivo_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSGuastoModificato.bind(this));
                    }
                    break;
                case "Inserisci Fermo":
                    if (this.ISLOCAL === 1) {
                        this.LOCALInserisciFermo();
                        this.oDialog.destroy();
                    } else {
                        data_inizio = this.SetDataIniziale();
                        data_fine = this.SetDataFinale();
                        obj = {};
                        obj.caso = "insert";
                        obj.logId = "";
                        obj.batchId = this.batch_id;
                        obj.dataFine = data_fine + 'T' + sap.ui.getCore().byId("Fine").getValue();
                        obj.dataInizio = data_inizio + 'T' + sap.ui.getCore().byId("Inizio").getValue();
                        obj.causaleId = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermiAttivo_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSGuastoModificato.bind(this));
                    }
                    break;
            }
        },
        SUCCESSGuastoModificato: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                this.guasti = Jdata.AllFermi;
                this.guasti = Library.AddTimeGaps(this.guasti);
                this.ModelGuasti.setData(this.guasti);
                sap.ui.getCore().setModel(this.ModelGuasti, "guasti");
                this.getView().setModel(this.ModelGuasti, "guasti");
                this.oDialog.destroy();
                this.oDialog = this.getView().byId("GestioneIntervalliFermo");
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 2000});
            }
        },
        SetDataIniziale: function () {
            var secondi_inizio = Library.fromStandardToSeconds(sap.ui.getCore().byId("Inizio").getValue());
            var inizio = this.getView().getModel("guasti").getData().dataInizioLavorazione.split("T")[0];
            var fine = this.getView().getModel("guasti").getData().dataInizioChiusura.split("T")[0];
            if (inizio === fine || secondi_inizio > 21600) {
                return inizio;
            } else {
                return fine;
            }
        },
        SetDataFinale: function () {
            var secondi_fine = Library.fromStandardToSeconds(sap.ui.getCore().byId("Fine").getValue());
            var inizio = this.getView().getModel("guasti").getData().dataInizioLavorazione.split("T")[0];
            var fine = this.getView().getModel("guasti").getData().dataInizioChiusura.split("T")[0];
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
//      **************** POPUP CAUSALIZZAZIONE ****************

        ChangeCheckedCausa: function (event) {
            var id = event.getSource().getId();
            var CB = this.getView().byId(id);
            var root_name_totale = "CBTotaleCausa";
            var i, temp_id;
            if (id.indexOf(root_name_totale) > -1) {
                if (CB.getSelected()) {
                    this.CheckTotaleCausa = 1;
                    for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                        this.ModelGuastiLinea.getData().fermi[i].selected = true;
                        this.CheckSingoloCausa[i] = 1;
                    }
                    this.ModelGuastiLinea.refresh();
                } else {
                    this.CheckTotaleCausa = 0;
                    for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                        this.ModelGuastiLinea.getData().fermi[i].selected = false;
                        this.CheckSingoloCausa[i] = 0;
                    }
                    this.ModelGuastiLinea.refresh();
                }
            } else {
                var discr_id = event.getSource().getParent().getId();
                for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                    temp_id = event.getSource().getParent().getParent().getAggregation("rows")[i].getId();
                    if (discr_id === temp_id) {
                        break;
                    }
                }
                if (CB.getSelected()) {
                    this.CheckSingoloCausa[i] = 1;
                } else {
                    this.CheckSingoloCausa[i] = 0;
                }
            }
            temp_id = 0;
            for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                temp_id += this.CheckSingoloCausa[i];
            }
            if (temp_id > 0) {
                this.getView().byId("ConfermaFermi").setEnabled(true);
            } else {
                this.getView().byId("ConfermaFermi").setEnabled(false);
            }
        },
        onCausalizzaButton: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermo&Content-Type=text/json&OutputParameter=JSON&IsManuale=0";
            }
            Library.AjaxCallerData(link, this.SUCCESSFermo.bind(this));
        },
        SUCCESSFermo: function (Jdata) {
            this.ModelCausali.setData(Jdata);
            this.getView().setModel(this.ModelCausali, "CausaliFermo");
            var oView = this.getView();
            this.onCloseDialog();
//            var old_id = this.GetActiveCB();
//            if (old_id !== 0) {
//                var old_CB = sap.ui.getCore().byId(old_id);
//                old_CB.setSelected(false);
//                this.CheckFermo[old_id] = 0;
//            }

            var dialog = this.getView().byId("CausalizzazioneFermoPanel");
            if (!dialog) {
                dialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermoPanel", this);
                oView.addDependent(dialog);
            }
            this.oDialog = dialog;
            var data = this.ModelCausali.getData().gerarchie;
            var num_gerarchie = data.length;
            var ID, CB;
            var cols = 2;
            var rows = Math.ceil(num_gerarchie / cols);
            var outerVBox = this.getView().byId("CausalizzazioneFermoPanelBox");
            if (outerVBox.getItems().length > 0) {
                outerVBox.destroyItems();
            }
            var vvbb1 = new sap.m.VBox({height: "90%", width: "100%"});
            var vvbb3 = new sap.m.VBox({height: "10%", width: "100%"});
            vvbb3.addStyleClass("sapUiMediumMarginTop");
            var hbox = new sap.m.HBox({height: "100%"});
            var vb1 = new sap.m.VBox({width: "15%"});
            var VB1 = new sap.m.VBox({width: "85%"});
            var L1_vbox, L2_hbox, L3_vbox, title, subdata;
            var L3_width = String(Math.round(100 / cols)) + "%";
            var index = 0;
            this.CheckFermo = [];
            for (var i = 0; i < rows; i++) {
                L2_hbox = new sap.m.HBox();
                L2_hbox.addStyleClass("sapUiSmallMarginBottom");
                for (var j = 0; j < cols; j++) {
                    title = new sap.m.Text({text: data[index].gerarchia});
                    title.addStyleClass("customText");
                    L3_vbox = new sap.m.VBox({width: L3_width});
                    L3_vbox.addItem(title);
                    subdata = data[index].attributi;
                    for (var k = 0; k < subdata.length; k++) {
                        ID = "CBFermo" + subdata[k].id;
                        this.CheckFermo[ID] = 0;
                        CB = new sap.m.CheckBox({
                            id: ID,
                            text: subdata[k].fermo,
                            select: this.ChangeCheckedFermo.bind(this),
                            selected: false});
                        L3_vbox.addItem(CB);
                    }
                    L2_hbox.addItem(L3_vbox);
                    index++;
                    if (index === data.length) {
                        break;
                    }
                }
                L1_vbox = new sap.m.VBox({});
                L1_vbox.addItem(L2_hbox);
                VB1.addItem(L1_vbox);
            }
            hbox.addItem(vb1);
            hbox.addItem(VB1);
            vvbb1.addItem(hbox);
            outerVBox.addItem(vvbb1);
            var hbox1 = new sap.m.HBox({});
            var vb0 = new sap.m.VBox({width: "10%"});
            var vb01 = new sap.m.VBox({width: "37%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "37%"});
            var vb4 = new sap.m.VBox({width: "10%"});
            var bt1 = new sap.m.Button({
                id: "AnnullaFermo",
                text: "Annulla",
                width: "100%",
                enabled: true,
                press: this.onCloseDialog.bind(this)});
            bt1.addStyleClass("annullaButton");
            var bt2 = new sap.m.Button({
                id: "ConfermaFermo",
                text: "Conferma",
                width: "100%",
                enabled: false,
                press: this.onConfermaFermoCausalizzato.bind(this)});
            bt2.addStyleClass("confermaButton");
            vb3.addItem(bt2);
            vb01.addItem(bt1);
            vb0.addItem(new sap.m.Text({}));
            vb2.addItem(new sap.m.Text({}));
            vb4.addItem(new sap.m.Text({}));
            hbox1.addItem(vb0);
            hbox1.addItem(vb01);
            hbox1.addItem(vb2);
            hbox1.addItem(vb3);
            hbox1.addItem(vb4);
            vvbb3.addItem(hbox1);
            outerVBox.addItem(vvbb3);
            dialog.open();
        },
        ChangeCheckedFermo: function (event) {
            var id = event.getSource().getId();
            var root_name = "CBFermo";
            this.id_split = this.SplitId(id, root_name);
            var old_id = this.GetActiveCB();
            if (typeof old_id === "string") {
                var old_CB = sap.ui.getCore().byId(old_id);
                old_CB.setSelected(false);
                this.CheckFermo[old_id] = 0;
            }
            if (old_id !== this.id_split[1]) {
                this.CheckFermo[this.id_split[1]] = 1;
            }
            var selected_index = this.GetActiveCB();
            var button = sap.ui.getCore().byId("ConfermaFermo");
            if (typeof selected_index === "string") {
                button.setEnabled(true);
            } else {
                button.setEnabled(false);
            }
        },
        GetActiveCB: function () {
            var res = 0;
            for (var key in this.CheckFermo) {
                if (this.CheckFermo[key] === 1) {
                    res = key;
                    break;
                }
            }
            return res;
        },
        onConfermaFermoCausalizzato: function () {
            var i, link;
            var data = this.ModelGuastiLinea.getData();
            var list_log = "";
            for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                if (this.CheckSingoloCausa[i] > 0) {
                    if (list_log === "") {
                        list_log += data.fermi[i].LogID;
                    } else {
                        list_log = list_log + "#" + data.fermi[i].LogID;
                    }
                }
            }
            link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdateLogCausale&Content-Type=text/json&ListLogID=" + list_log + "&CausaleID=" + this.id_split[2];
            Library.SyncAjaxCallerVoid(link);
            link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            Library.AjaxCallerData(link, this.SUCCESSModificaCausale.bind(this));
        },
        SUCCESSModificaCausale: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            this.getView().setModel(this.ModelLinea, "linea");
            this.ModelLinea.refresh(true);
            this.onCloseDialog();
        },
        onCloseDialog: function () {
            this.RerenderTimePickers();
            var id_dialog = this.oDialog.getId().split("--")[1];
            this.getView().byId(id_dialog).close();
//            this.oDialog = null;
            if (id_dialog === "GestioneIntervalliFermo") {
                this.STOP = 0;
                this.RefreshFunction(0, "1");
            }
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** FUNZIONI LOCALI ****************

        LOCALSUCCESSDatiOperatore: function (Jdata) {
            this.ModelOperatori.setData(Jdata);
            this.getView().setModel(this.ModelOperatori, 'operatore');
        },
        LOCALSUCCESSSKUstd: function (Jdata) {
            this.ModelSKUstd.setData(Jdata);
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
    return ManagePianoGreen;
});