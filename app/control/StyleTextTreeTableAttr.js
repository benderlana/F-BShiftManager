sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text",
    'jquery.sap.global'
], function (Control, Label, Text, jQuery) {
    "use strict";
    var StyleTextTreeTableAttr = Text.extend("myapp.control.StyleTextTreeTableAttr", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                diff: {type: "string", defaultValue: 0},
                area: {type: "string", defaultValue: 0}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.TextRenderer.render(oRm, oControl);
        },
        onAfterRendering: function () {
            
            if (this.getArea() === "0") {
                jQuery.sap.byId(this.getId()).parent().parent().css("background-color", "#eeeeee");

            }
            if (this.getArea() === "1") {
                jQuery.sap.byId(this.getId()).parent().parent().css("background-color", "#b6d7a8");
            }
            if (this.getArea() === "2") {
                jQuery.sap.byId(this.getId()).parent().parent().css("background-color", "#ffe599");
            }
////            if (this.getDiff() === "1") {
//                this.addStyleClass('diffRed');
//            } else {
//                this.removeStyleClass('diffRed');
//                this.removeStyleClass('diffLink');
//            }
        }
    });
    return StyleTextTreeTableAttr;
});