sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    var CustomStatsButton = Button.extend("myapp.control.CustomStatsButton", {

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
            var classes = ["ActiveStats", "SPCButtonEmpty"];
            var state = ((this.getStato() !== "Disponibile.Lavorazione") && (this.getStato() !== "Disponibile.Fermo")) ? "Inactive" : "Active";
            for (var k = 0; k < classes.length; k++) {
                this.removeStyleClass(classes[k]);
            }
            if (state) {
                switch (state) {
                    case 'Active':
                        this.setEnabled(true);
                        this.setIcon("sap-icon://bar-chart");
                        this.addStyleClass("ActiveStats");
                        break;
                    default:
                        this.setEnabled(false);
                        this.setIcon("");
                        this.addStyleClass("SPCButtonEmpty");
                        break;
                }
            }
        }
    });
    return CustomStatsButton;
});