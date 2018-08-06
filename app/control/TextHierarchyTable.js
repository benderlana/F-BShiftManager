sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Text"
], function (Control, Label, Text) {
    "use strict";

    var StyleTextTreeTableAttr = Text.extend("myapp.control.TextHierarchyTable", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },

            properties: {
                hierarchy: {type: "int", defaultValue: "0"},
                red: {type: "boolean", deafultValue: false},
                colName: {type:"string", defaultValue: ""}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.TextRenderer.render(oRm, oControl);
        },

        onAfterRendering: function () {
            if (this.getHierarchy() === 3){
                if (this.getRed()){
                    this.addStyleClass("redText");
                } else {
                    this.removeStyleClass("redText");
                }
                if (this.colName === "dispFermate" || this.colName === "dispSetup"){
                    this.addStyleClass("myCursor");
                } else {
                    this.removeStyleClass("myCursor");
                }
            } else {
                this.removeStyleClass("redText");
            }
        
        
        }
    });

    return StyleTextTreeTableAttr;
});

