sap.ui.define([
    'sap/m/MessageToast',
    'jquery.sap.global',
    './Formatter',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (MessageToast, jQuery, Formatter, Controller, JSONModel) {
    "use strict";

    var ManagePiano = Controller.extend("myapp.controller.ManagePiano", {

        oModel: null,
        oModel3: null,
        prova: null,
        onInit: function () {

            var params = jQuery.sap.getUriParameters(window.location.href);
            // set explored app's demo model on this sample
            this.oModel = new JSONModel("./model/linee.json");
            this.oModel3 = new JSONModel("./model/operators.json");

            this.getView().setModel(this.oModel, 'linea');
            this.getView().setModel(this.oModel3, 'operatore');
            //this.getView().setModel(oModel2,"prodotto");

        },

        onAfterRendering: function () {


        },
        pressami: function () {
            alert("pressssss");

        },
        onToTmpPage: function (event) {

            this.getOwnerComponent().getRouter().navTo("tmp");

        },
        managePiano: function (evt) {
            alert("miao anche a te");
        },
        handlePressOpenMenu: function (oEvent) {
            var oButton = oEvent.getSource();

            // create menu only once
            if (!this._menu) {
                this._menu = sap.ui.xmlfragment(
                        "myapp.view.MenuItemEventing",
                        this
                        );
                this.getView().addDependent(this._menu);

            }

            var eDock = sap.ui.core.Popup.Dock;
            this.prova = new JSONModel("./model/prova.json");
            this._menu.setModel(this.prova);
            this._menu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
        },

        handleMenuItemPress: function (oEvent) {
            var msg = "'" + oEvent.getParameter("item").getText() + "' pressed";
            MessageToast.show(msg);
        },

        handleTextFieldItemPress: function (oEvent) {
            var msg = "'" + oEvent.getParameter("item").getValue() + "' entered";
            MessageToast.show(msg);
        },
        onPress: function (evt) {
            alert("ho cliccato");
        }

    });

    return ManagePiano;

});