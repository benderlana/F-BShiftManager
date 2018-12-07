sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    return Button.extend("myapp.control.CustomButtonLinea", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                stato: {type: "string", defaultValue: "NonDisponibile"}
            }
        },
        renderer: {},

        onAfterRendering: function () {
            var classes = ["LineaDispo", "LineaNonDispo", "LineaVuota", "LineaAttrezzaggio", "LineaLavorazione", "LineaFermo", "LineaSvuotamento"];
            var state = (this.getStato() === "") ? "NonDisponibile" : this.getStato();
            var stateArray = state.split(".");
            for (var k = 0; k < classes.length; k++) {
                this.removeStyleClass(classes[k]);
            }
            if (stateArray[0]) {
                switch (stateArray[0]) {
                    case 'Disponibile':
                        this.addStyleClass("LineaDispo");
                        break;
                    case 'NonDisponibile':
                        this.addStyleClass("LineaNonDispo");
                        break;
                }
            }
            if (stateArray[1]) {
                switch (stateArray[1]) {
                    case "Vuota":
                        this.addStyleClass("LineaVuota");
                        break;
                    case "Attrezzaggio":
                        this.addStyleClass("LineaAttrezzaggio");
                        break;
                    case "Lavorazione":
                        this.addStyleClass("LineaLavorazione");
                        break;
                    case "Fermo":
                        this.addStyleClass("LineaFermo");
                        break;
                    case "Svuotamento":
                        this.addStyleClass("LineaSvuotamento");
                        break;
                }
            }
        }
    });
});