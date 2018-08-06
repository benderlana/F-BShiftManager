sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";
    return Controller.extend("myapp.controller.ManagePianoGrey", {

//        VARIABILI GLOBALI
        StabilimentoID: null,
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        pdcID: null,
        ModelCausali: new JSONModel({}),
        ModelTurni: null,
        ModelLinea: null,
        ModelOEE: new JSONModel({}),
        ModelGuasti: new JSONModel({}),
        ModelGuastiLinea: new JSONModel({}),
        ModelPianoParameters: null,
        oLinea_index: null,
        linea: null,
        button_fermo: null,
        ISLOCAL: Number(sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL),
        oColumn: null,
        oContent: null,
        CheckSingoloCausa: [],
        CheckTotaleCausa: 0,
        oDialog: null,
        CheckFermo: null,
        id_split: null,
        oButton: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        data_json: {},
        getDialog: null,

//        FUNZIONI D'INIZIALIZZAZIONE
        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePianoGrey").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (event) {
            this.getDialog = sap.ui.getCore().byId("GlobalBusyDialog");
            this.getDialog.close();
            this.StabilimentoID = sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID;
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").getData().pdc;
            this.repartoID = sap.ui.getCore().getModel("ParametriPiano").getData().reparto;
            this.ModelLinea = sap.ui.getCore().getModel("linee");
            this.ModelTurni = sap.ui.getCore().getModel("turni");
            this.ModelPianoParameters = sap.ui.getCore().getModel("ParametriPiano").getData();
            this.turnoPath = event.getParameter("arguments").turnoPath;
            this.pianoPath = event.getParameter("arguments").pianoPath;
            var oTitle = this.getView().byId("ReportTitle");
            this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            oTitle.setText(this.piano.data + "    -    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
            this.getView().setModel(this.ModelLinea, "linea");
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> FUNZIONI CHIAMATE AL CLICK <<<<<<<<
//        
//        ************************ INTESTAZIONE ************************
//        
//         -> CREA REPORT
        CreateReport: function () {
            if (!this.getView().byId("reportButton").getEnabled()) {
                var link;
                if (this.ISLOCAL === 1) {
                    link = "model/OEE.json";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcPassato_GetReportOEE&Content-Type=text/json&stabilimentoID=" + this.ModelPianoParameters.stabilimento + "&pdcID=" + this.ModelPianoParameters.pdc + "&repartoID=" + this.getView().byId("ManageIconTabBar").getSelectedKey() + "&OutputParameter=JSON";
                }
                Library.AjaxCallerData(link, this.SUCCESSReportCreated.bind(this));
            }
        },
        SUCCESSReportCreated: function (Jdata) {
            if (this.ISLOCAL === 1) {
                this.ModelOEE.setData(Jdata);
            } else {
                this.ModelLinea.setData(Jdata.PDC);
                sap.ui.getCore().setModel(this.ModelLinea, "linee");
                this.getView().setModel(this.ModelLinea, "linea");
                this.ModelOEE.setData(Jdata.OEE);
            }
            sap.ui.getCore().setModel(this.ModelOEE, "ReportOEE");
            this.getView().setModel(this.ModelOEE, "ReportOEE");
            this.RendiInformazioniVisibili();
        },
//         -> MOSTRA REPORT
        ShowReport: function () {
            var that = this;
            this.getView().byId("ManageIconTabBar").setSelectedKey("1");
            this.getOwnerComponent().getRouter().navTo("Report", {turnoPath: that.turnoPath, pianoPath: that.pianoPath});
        },
//         -> CHIUSURA PIANO
        ConfermaChiusuraPiano: function () {
            if (this.ISLOCAL === 1) {
                this.SUCCESSConfermaChiusura();
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdatePdcToChiuso&Content-Type=text/json&PdcID=" + this.pdcID + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, this.SUCCESSConfermaChiusura.bind(this));
            }
        },
        SUCCESSConfermaChiusura: function (Jdata) {
            this.RemoveReport();
            this.getView().byId("ManageIconTabBar").setSelectedKey("1");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("piani");
        },
//         -> PULSANTE D'USCITA
        BackToPiani: function () {
            this.getView().byId("ManageIconTabBar").setSelectedKey("1");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("piani", true);
            this.getView().byId("chiusuraPiano").setEnabled(false);
            this.RemoveReport();
        },
//         -> CAMBIO REPARTO
        ChangeReparto: function (event) {
            var link;
            var that = this;
            var area = this.piano.area;
            var repartoId = event.getParameters().key;
            var pdcId = this.piano.PdcID;
            if (this.ISLOCAL === 1) {
                if (area === "0") {
                    link = "model/linee.json";
                } else {
                    link = "model/linee_new.json";
                }
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.ModelLinea.setData(Jdata);
                if (that.getView().byId("reportButton").getEnabled()) {
                    that.RendiInformazioniVisibili();
                }
            });
            this.getView().setModel(this.ModelLinea, "linee");
        },

//       ************************ TABELLA ************************

        CausalizzazioneFermi: function (event) {
            var batchId;
            if (event) {
                var rowPath = event.getSource().getBindingContext("linea").sPath;
                var row_binded = this.getView().getModel("linea").getProperty(rowPath);
                batchId = row_binded.batchID;
                this.oLinea_index = event.getSource().getBindingContext("linea").sPath.split("/")[2];
                var oLinea_path = event.getSource().getBindingContext("linea").sPath;
                this.linea = this.getView().getModel("linea").getProperty(oLinea_path);
                this.button_fermo = event.getSource();
            }
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/guasti_new.json";
            } else {
                if (batchId === undefined) {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausaFromLineaIDandPdcID&Content-Type=text/json&LineaID=" + this.linea.lineaID + "&PdcID=" + this.pdcID + "&OutputParameter=JSON";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausaFromBatchID&Content-Type=text/json&BatchID=" + batchId + "&OutputParameter=JSON";
                }
            }
            Library.AjaxCallerData(link, this.SUCCESSGuasti.bind(this));
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
            var oTable = this.getView().byId("TotaleTable");
            oTable.setVisible(true);
            oTable.getItems()[0].getCells()[3].setSelected(false);
            this.CheckTotaleCausa = 0;
            this.getView().byId("NoFermiDaCausalizzare").setVisible(false);
            this.oDialog.open();
        },

//        >>>>>>>>>>>>>>>>>> FUNZIONI DI SUPPORTO <<<<<<<<<<<<<<<<<<

        RendiInformazioniVisibili: function () {
            this.getView().byId("chiusuraPiano").setEnabled(true);
            this.getView().byId("reportButton").setEnabled(true);
            var oItems = this.getView().byId("ManagePianoTableGrey").getAggregation("items");
            for (var i = 0; i < oItems.length; i++) {
                var oTable = oItems[i].getCells()[0].getItems()[1].getItems()[0].getItems()[1].getContent()[0];
                var oTable_Header = oItems[i].getCells()[0].getItems()[1].getItems()[0].getItems()[0];
                oTable.getColumns()[7].setVisible(true);
                oTable.getColumns()[8].setVisible(true);
                oTable.getColumns()[9].setVisible(true);
                oTable.getColumns()[10].setVisible(true);
                oTable.getColumns()[11].setVisible(true);
                oTable_Header.getColumns()[7].setVisible(true);
                oTable_Header.getColumns()[8].setVisible(true);
                oTable_Header.getColumns()[9].setVisible(true);
                oTable_Header.getColumns()[10].setVisible(true);
                oTable_Header.getColumns()[11].setVisible(true);
                var oLinea = oItems[i].getCells()[0].getItems()[0].getItems()[1];
                oLinea.getItems()[0].getItems()[0].setVisible(true);
                oLinea.getItems()[1].getItems()[0].setVisible(true);
                oLinea.getItems()[2].getItems()[0].setVisible(true);
                oLinea.getItems()[3].getItems()[0].setVisible(true);
                oLinea.getItems()[4].getItems()[0].setVisible(true);
            }
        },
        RemoveReport: function () {
            this.getView().byId("chiusuraPiano").setEnabled(false);
            this.getView().byId("reportButton").setEnabled(false);
            var oItems = this.getView().byId("ManagePianoTableGrey").getAggregation("items");
            for (var i = 0; i < oItems.length; i++) {
                var oTable = oItems[i].getCells()[0].getItems()[1].getItems()[0].getItems()[1].getContent()[0];
                var oTable_Header = oItems[i].getCells()[0].getItems()[1].getItems()[0].getItems()[0];
                oTable.getColumns()[7].setVisible(false);
                oTable.getColumns()[8].setVisible(false);
                oTable.getColumns()[9].setVisible(false);
                oTable.getColumns()[10].setVisible(false);
                oTable.getColumns()[11].setVisible(false);
                oTable_Header.getColumns()[7].setVisible(false);
                oTable_Header.getColumns()[8].setVisible(false);
                oTable_Header.getColumns()[9].setVisible(false);
                oTable_Header.getColumns()[10].setVisible(false);
                oTable_Header.getColumns()[11].setVisible(false);
                var oLinea = oItems[i].getCells()[0].getItems()[0].getItems()[1];
                oLinea.getItems()[0].getItems()[0].setVisible(false);
                oLinea.getItems()[1].getItems()[0].setVisible(false);
                oLinea.getItems()[2].getItems()[0].setVisible(false);
                oLinea.getItems()[3].getItems()[0].setVisible(false);
                oLinea.getItems()[4].getItems()[0].setVisible(false);
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

            var dialog = oView.byId("CausalizzazioneFermoPanel");
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
            var CB = sap.ui.getCore().byId(this.id_split[1]);
            var i, link, j;
            var data = this.ModelGuastiLinea.getData();
            if (Number(this.ISLOCAL === 1)) {
                for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                    if (this.CheckSingoloCausa[i] > 0) {
                        data.fermi[i].causale = CB.getProperty("text");
                        for (j in data.fermi) {
                            if (data.fermi[i].inizio === data.fermi[j].inizio) {
                                data.fermi[j].causale = CB.getProperty("text");
                                break;
                            }
                        }
                    }
                }
                this.ModelGuastiLinea.setData(data);
                this.onCloseDialog();
            } else {
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
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, this.SUCCESSModificaCausale.bind(this));
            }

        },
        SUCCESSModificaCausale: function (Jdata) {
            this.ModelLinea.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinea, "linee");
            this.getView().setModel(this.ModelLinea, "linea");
            this.ModelLinea.refresh(true);
            this.onCloseDialog();
        },
        onCloseDialog: function () {
            var id_dialog = this.oDialog.getId().split("--")[1];
            this.getView().byId(id_dialog).close();
//            this.oDialog = null;
        },
        DestroyDialog: function (event) {
            this.oDialog.destroy();
        },
        SplitId: function (id, string) {
            var splitter = id.indexOf(string);
            var root = id.substring(0, splitter);
            var real_id = id.substring(splitter, id.length);
            var index = id.substring(splitter + string.length, id.length);
            return [root, real_id, index];
        }
    });
});