sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/ProgressIndicator",
    'jquery.sap.global'
], function (Control, ProgressIndicator, jQuery) {
    "use strict";
    return ProgressIndicator.extend("myapp.control.CustomProgressIndicator", {

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
            var state = this.getStato();
            if (state) {
                switch (state) {
                    case "yellow":
                        this.setState("Warning");
                        break;
                    case "green":
                        this.setState("Success");
                        break;
                    case "orange":
                        this.setState("Error");
                        break;
                    default:
                        this.setState("None");
                        break;
                }
            }
        }
    });
});