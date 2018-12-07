sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (MessageToast, jQuery, Controller, JSONModel, Library) {
    "use strict";
    var MainController = Controller.extend("myapp.controller.Main", {

        ISLOCALModel: new JSONModel({}),
        ModelReparti: new JSONModel({}),
        ISLOCAL: null,
        ModelLinee: new JSONModel({}),
        ModelTiles: new JSONModel({}),
        BusyDialog: new sap.m.BusyDialog(),
        onInit: function () {
            this.ISLOCAL = Number(jQuery.sap.getUriParameters().get("ISLOCAL"));
            this.ISLOCALModel.setData({"ISLOCAL": this.ISLOCAL});
            sap.ui.getCore().setModel(this.ISLOCALModel, "ISLOCAL");
        },
        onToPianiPage: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_Reparti.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllReparti&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.SUCCESSReparti.bind(this));
        },
        SUCCESSReparti: function (Jdata) {
            this.ModelReparti.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelReparti, "reparti");
            this.getOwnerComponent().getRouter().navTo("piani");
        },
        onSinotticiPage: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/linee_riepilogo.json";
            } else {
                this.BusyDialog.open();
//                link = "model/JSON_RiepilogoLinee";
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoSinottico&Content-Type=text/json&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, this.SUCCESSModelLinee.bind(this));
//                MessageToast.show("Not yet available", {duration: 3000});
//                this.getOwnerComponent().getRouter().navTo("RiepilogoLinee");
//                this.BusyDialog.close();
            }
        },
        SUCCESSModelLinee: function (Jdata) {
            this.ModelLinee.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelLinee, "linee");
            this.getOwnerComponent().getRouter().navTo("RiepilogoLinee");
            this.BusyDialog.close();
        }
    });
    return MainController;
});