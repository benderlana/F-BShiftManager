sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    var CustomButt = Button.extend("myapp.control.CustomButt", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                value: {type: "string", defaultValue: 0},
                text: {type: "string", defaultValue: ""}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.ButtonRenderer.render(oRm, oControl);
        },
        onAfterRendering: function () {

            if (this.getValue() === "0") {
                //jQuery.sap.byId(this.getId()).addClass("verderde");

            }
            if (this.getValue() === "1") {
                jQuery.sap.byId(this.getId()).addClass("bianconco");
                this.setText("***");
            }
            if (this.getValue() === "2") {
                jQuery.sap.byId(this.getId()).addClass("rossorso");
                this.setText("***");

            }
////            if (this.getDiff() === "1") {
//                this.addStyleClass('diffRed');
//            } else {
//                this.removeStyleClass('diffRed');
//                this.removeStyleClass('diffLink');
//            }
        }
    });
    return CustomButt;
});