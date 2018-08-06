sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";

    return Controller.extend("myapp.controller.SinotticiDiLinea", {
        ModelLinee: sap.ui.getCore().getModel("elencolinee"),
        ModelSinottico: sap.ui.getCore().getModel("sinotticodilinea"),
        onInit: function () {
            this.getView().setModel(this.ModelLinee, "elencolinee");


            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("sinotticoLinea").attachPatternMatched(this._onObjectMatched, this);
        },
        _onObjectMatched: function () {
            var oTable = this.getView().byId("sinotticiTable");
            oTable.setModel(this.ModelSinottico, "sinotticodilinea");

            var TabBar = this.getView().byId("IconTabBar");
            var LineaCliccata_ID = sap.ui.getCore().getModel("LineaCliccata").getData().lineaID; 
            TabBar.setSelectedKey(LineaCliccata_ID);
            TabBar.rerender();
        },
        GoToHome: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("main", true);
        },
        handleIconTabBarSelect: function () {
            Library.AjaxCallerData("model/sinotticodilinea2.json", this.SUCCESSSinottico.bind(this));
            this.getView().byId("sinotticiTable").setModel(this.ModelSinottico, "sinotticodilinea");
        },
        SUCCESSSinottico: function (Jdata) {
            this.ModelSinottico.setData(Jdata);
        }

    });
});

