sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library',
    'sap/m/MessageToast'
], function (Controller, JSONModel, Library, MessageToast) {
    "use strict";
    return Controller.extend("myapp.controller.guastiLinea", {
        ISLOCAL: Number(sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL),
        pdcID: null,
        batchID: null,
        linea: "",
        menuJSON: {},
        row_binded: {},
        ModelCausali: new JSONModel({}),
        ModelTurni: sap.ui.getCore().getModel("turni"),
        ModelGuasti: sap.ui.getCore().getModel("guasti"),
        guasti: sap.ui.getCore().getModel("guasti").getData(),
        piano: null,
        button: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
//        FUNZIONI D'INIZIALIZZAZIONE
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("guastidilinea").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (oEvent) {
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").getData().pdc;
            this.batchID = sap.ui.getCore().getModel("batchID").batchID; 
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.linea = oEvent.getParameter("arguments").guastiPath;
            this.getView().setModel(this.ModelGuasti, "guasti");
            var oTitle = this.getView().byId("turno");
            this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            oTitle.setText(this.piano.data + "    -    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> FUNZIONI CHIAMATE AL CLICK <<<<<<<<
//        
//        ************************ INTESTAZIONE ************************
//        
//      -> PULSANTE D'USCITA        
        ReturnToReport: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/OEE_update.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/CreateReportOEE&Content-Type=text/json&PdcID=" + this.pdcID + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.SUCCESSModificaOEE.bind(this));

        },
        SUCCESSModificaOEE: function (Jdata) {
            var ModelOEE = sap.ui.getCore().getModel("ReportOEE");
            ModelOEE.setData(Jdata);
            sap.ui.getCore().setModel(ModelOEE, "ReportOEE");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Report", {turnoPath: this.turnoPath, pianoPath: this.pianoPath});
        },
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
//        ************************ TABELLA ************************
//    
//      -> CREAZIONE MENU PER LA GESTIONE DEI GUASTI
        OpenMenuCausalizzazione: function (oEvent) {
            this.Button = oEvent.getSource();
            var link;
            this.row_binded = this.Button.getParent().getBindingContext("guasti").getObject();
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermoPiatta&Content-Type=text/json&OutputParameter=JSON&IsManuale=" + this.row_binded.isManuale;
            }
            Library.AjaxCallerData(link, this.SUCCESSCausali.bind(this));
        },
        SUCCESSCausali: function (Jdata) {
            this.ModelCausali.setData(Jdata);
            this.getView().setModel(this.ModelCausali, "cause");
            if (!this._menu) {
                this._menu = sap.ui.xmlfragment(
                        "myapp.view.MenuCausalizzazione",
                        this
                        );
                this.getView().addDependent(this._menu);
            }
            var eDock = sap.ui.core.Popup.Dock;
            this._menu.open(this._bKeyboard, this.Button, eDock.EndTop, eDock.BeginBottom, this.Button);
        },

//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> GESTIONE GUASTI <<<<<<<<
//        
//       
        ModificaGuasti: function (oEvent) {
            var oText = oEvent.getParameter("item").getText();
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
        DestroyDialog: function () {
            var id_dialog = this.oDialog.getId();
            sap.ui.getCore().byId(id_dialog).destroy();
        },
//    
//      -> CREAZIONE DIALOG PER MODIFICA CAUSALIZZAZIONE
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
                text: this.row_binded.causale
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
//    
//      -> CREAZIONE DIALOG PER MODIFICA INIZIO/FINE
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
                text: this.row_binded.fine
            });
            var oTextInizio = new sap.m.Text({
                text: this.row_binded.inizio
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
                value: this.row_binded.fine,
                id: "Fine"
            });
            oTextInizio = new sap.m.TimePicker({
                localeId: "it_IT",
                value: this.row_binded.inizio,
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
//    
//      -> CREAZIONE DIALOG PER FRAZIONAMENTO
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
                text: this.row_binded.inizio
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
                text: this.row_binded.fine
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
                value: this.row_binded.inizio,
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
                value: this.row_binded.fine,
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
//    
//      -> CREAZIONE DIALOG PER MODIFICA ELIMINAZIONE
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
                value: this.row_binded.inizio,
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
                text: this.row_binded.causale
            });
            if (this.row_binded.causale === "") {
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
                value: this.row_binded.fine,
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
// INSERIMENTO DIALOG
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
        ConfermaCambio: function (oEvent) {
            var oText = this.getView().byId("title").getText();
            var obj, link, data_inizio, data_fine;
            switch (oText) {
                case "Modifica Causale Fermo":
                    if (this.ISLOCAL === 1) {
                        this.LOCALModificaCausaleFermo(oEvent);
                        this.oDialog.destroy();
                    } else {
                        obj = {};
                        obj.caso = "updateCausale";
                        obj.logId = this.row_binded.LogID;
                        obj.batchId = this.row_binded.batchID;
                        obj.dataFine = "";
                        obj.dataInizio = "";
                        obj.causaleId = sap.ui.getCore().byId('selectionMenu').getSelectedKey();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermi_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
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
                        obj.logId = this.row_binded.LogID;
                        obj.batchId = this.row_binded.batchID;
                        obj.dataFine = data_fine + 'T' + sap.ui.getCore().byId("Fine").getValue();
                        obj.dataInizio = data_inizio + 'T' + sap.ui.getCore().byId("Inizio").getValue();
                        obj.causaleId = "";
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermi_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
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
                        obj.logId = this.row_binded.LogID;
                        obj.batchId = this.row_binded.batchID;
                        obj.dataFine = data_fine + 'T' + sap.ui.getCore().byId("Fine").getValue();
                        obj.dataInizio = data_inizio + 'T' + sap.ui.getCore().byId("Inizio").getValue();
                        obj.causaleId = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermi_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
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
                        obj.logId = this.row_binded.LogID;
                        obj.batchId = this.row_binded.batchID;
                        obj.dataFine = "";
                        obj.dataInizio = "";
                        obj.causaleId = "";
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermi_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
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
                        obj.batchId = this.batchID;
                        obj.dataFine = data_fine + 'T' + sap.ui.getCore().byId("Fine").getValue();
                        obj.dataInizio = data_inizio + 'T' + sap.ui.getCore().byId("Inizio").getValue();
                        obj.causaleId = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboGestionFermi_GetAllFermi&Content-Type=text/json&xml=" + Library.createXMLFermo(obj) + "&OutputParameter=JSON";
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////// FUNZIONI LOCALI (QUANDO IL BACKEND NON E' PRESENTE)

        LOCALModificaCausaleFermo: function (oEvent) {
            var oModel = new JSONModel();
            var selected_key = oEvent.getSource().getParent().getContent()[0].getItems()[2].getItems()[1].getItems()[0].getSelectedKey();
            for (var i in this.guasti.guasti) {
                if (this.isObjectEquivalent(this.guasti.guasti[i], this.row_binded)) {
                    var causa = this.takeCausaById(selected_key);
                    this.guasti.guasti[i].causa = causa;
                    oModel.setData(this.guasti);
                    this.getView().setModel(oModel, "guasti");
                    break;
                }
            }
        },
        LOCALModificaTempiFermo: function () {
            var oModel = new JSONModel();
            var stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
            var stringa_fine = sap.ui.getCore().byId("Fine").getValue();
            if (stringa_inizio !== "" || stringa_fine !== "") {
                if (stringa_inizio === "") {
                    stringa_inizio = this.row_binded.inizio;
                }
                if (stringa_fine === "") {
                    stringa_fine = this.row_binded.fine;
                }
                var secondi_inizio = this.fromStringToSeconds(stringa_inizio);
                var secondi_fine = this.fromStringToSeconds(stringa_fine);
                if (secondi_fine - secondi_inizio > 0) {
                    var stringa_intervallo = Library.MillisecsToStandard(1000 * (secondi_fine - secondi_inizio));
                    for (var i in this.guasti.guasti) {
                        if (this.isObjectEquivalent(this.guasti.guasti[i], this.row_binded)) {
                            this.guasti.guasti[i].inizio = stringa_inizio;
                            this.guasti.guasti[i].fine = stringa_fine;
                            this.guasti.guasti[i].intervallo = stringa_intervallo;
                            oModel.setData(this.guasti);
                            this.getView().setModel(oModel, "guasti");
                            break;
                        }
                    }
                }
            }
        },
        LOCALFrazionaFermo: function () {
            var binded_inizio = this.row_binded.inizio;
            var stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
            var stringa_fine = sap.ui.getCore().byId("Fine").getValue();
            var binded_fine = this.row_binded.fine;
            var binded_causale = this.row_binded.causale;
            var selected_key = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
            var causale = this.takeCausaById(selected_key);
            var i = this.findIndex(this.guasti.guasti, this.row_binded);
            //il terzo parametro mi serve per decidere se settare o no il modello (così da poterlo settare solo alla fine e poter riusare le funzioni anche per azioni successive
            this.removeGuasto(this.guasti, i, false);
            this.addGuasto(this.guasti, binded_inizio, stringa_inizio, binded_causale, false);
            this.addGuasto(this.guasti, stringa_inizio, stringa_fine, causale, false);
            this.addGuasto(this.guasti, stringa_fine, binded_fine, binded_causale, true);
        },
        LOCALEliminaFermo: function () {
            var i = this.findIndex(this.guasti.guasti, this.row_binded);
            this.removeGuasto(this.guasti, i, true);
        },
        LOCALInserisciFermo: function () {
            var stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
            var stringa_fine = sap.ui.getCore().byId("Fine").getValue();
            var selected_key = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
            var causale = this.takeCausaById(selected_key);
            this.addGuasto(this.guasti, stringa_inizio, stringa_fine, causale, true);
        },
        findIndex: function (array, obj) {
            for (var i in array) {
                if (this.isObjectEquivalent(array[i], obj)) {
                    return i;
                }
            }
            return -1;
        },
        isObjectEquivalent: function (obj1, obj2) {
            var aProps = Object.getOwnPropertyNames(obj1);
            var bProps = Object.getOwnPropertyNames(obj1);
            if (aProps.length !== bProps.length) {
                return false;
            }
            for (var key in obj1) {
                if (obj1[key] !== obj2[key]) {
                    return false;
                }
            }
            return true;
        },
        removeGuasto: function (JSONObject, index, flag) {
            var aProps = Object.getOwnPropertyNames(JSONObject);
            var array = JSONObject[aProps[2]];
            array.splice(index, 1);
            if (flag) {
                var oModel = new JSONModel();
                oModel.setData(JSONObject);
                this.getView().setModel(oModel, "guasti");
            }
        },
        addGuasto: function (JSONObject, inizio, fine, causale, flag) {
            var aProps = Object.getOwnPropertyNames(JSONObject);
            var array = JSONObject[aProps[2]];
            var secondi_intervallo = 1000 * (this.fromStringToSeconds(fine) - this.fromStringToSeconds(inizio));
            if (secondi_intervallo !== 0) {
                var obj = {};
                obj.inizio = inizio;
                obj.fine = fine;
                obj.causa = causale;
                obj.intervallo = Library.MillisecsToStandard(secondi_intervallo);
                array.push(obj);
            }
            if (flag) {
                var oModel = new JSONModel();
                oModel.setData(JSONObject);
                this.getView().setModel(oModel, "guasti");
            }
        },
        takeCausaById: function (selected_key) {
            var causa = "";
            for (var i in this.menuJSON.cause) {
                if (this.menuJSON.cause[i].id === selected_key) {
                    causa = this.menuJSON.cause[i].fermo;
                    break;
                }
            }
            return causa;
        },
        fromStringToSeconds: function (stringa) {
            var array_stringa = stringa.split(":");
            return  parseInt(array_stringa[0], 10) * 60 * 60 + parseInt(array_stringa[1], 10) * 60 + parseInt(array_stringa[2], 10);
        }
    });
});

