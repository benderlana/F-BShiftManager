sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonSettings", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                stato: {type: "string", defaultValue: ""}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var classes = ["BatchInMacchina", "BatchInAttesa", "BatchTrasferito", "BatchSchedulato"];
            var stato = this.getStato();
            for (var k = 0; k < classes.length; k++) {
                this.removeStyleClass(classes[k]);
            }
            switch (stato) {
                case 'In lavorazione':
                case 'Attrezzaggio':
                    this.addStyleClass("BatchInMacchina");
                    break;
                case 'Attesa presa in carico':
                    this.addStyleClass("BatchTrasferito");
                    break;
                case 'Schedulato':
                    this.addStyleClass("BatchSchedulato");
                    break;
                default:
                    this.addStyleClass("BatchInAttesa");
                    break;
            }
        }
    });
});