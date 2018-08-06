sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text",
    'jquery.sap.global'
], function (Control, Label, Text, jQuery) {
    "use strict";
    var StyleTextTableAttr = Text.extend("myapp.control.StyleTextTableAttr", {

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
                jQuery.sap.byId(this.getId()).parent().parent().css("background-color", "#f2f2f2");
            }
            if (this.getArea() === "1") {
                jQuery.sap.byId(this.getId()).parent().parent().css("background-color", "#7CA295");
            }
            if (this.getArea() === "2") {
                jQuery.sap.byId(this.getId()).parent().parent().css("background-color", "#FFD300");
            }
        }
    });
    return StyleTextTableAttr;
});