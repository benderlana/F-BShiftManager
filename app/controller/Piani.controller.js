sap.ui.define([
    'jquery.sap.global',
    './Formatter',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Formatter, Controller, JSONModel) {
    "use strict";

    var PianiController = Controller.extend("myapp.controller.Piani", {

        onInit: function () {

            var params = jQuery.sap.getUriParameters(window.location.href);
            // set explored app's demo model on this sample
            var oModel = new JSONModel("./model/pianidiconf.json");
            this.getView().setModel(oModel);
        },

        onAfterRendering: function () {


        },

        onToTmpPage: function (event) {

            this.getOwnerComponent().getRouter().navTo("tmp");

        },
        managePiano: function (evt) {
            this.getOwnerComponent().getRouter().navTo("managePiano");
        }

    });

    return PianiController;

});