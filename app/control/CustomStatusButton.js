sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    var CustomStatusButton = Button.extend("myapp.control.CustomStatusButton", {

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
            var classes = ["LineRunning", "LineStopped"];
            var state = (this.getStato() !== "Disponibile.Lavorazione") ? "Stop" : "Run";
            for (var k = 0; k < classes.length; k++) {
                this.removeStyleClass(classes[k]);
            }
            if (state) {
                switch (state) {
                    case 'Run':
                        this.addStyleClass("LineRunning");
                        break;
                    default:
                        this.addStyleClass("LineStopped");
                        break;
                }
            }
        }
    });
    return CustomStatusButton;
});