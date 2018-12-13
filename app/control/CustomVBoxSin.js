sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/VBox",
    'jquery.sap.global'
], function (Control, VBox, jQuery) {
    "use strict";
    var CustomVBoxSin = VBox.extend("myapp.control.CustomVBoxSin", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: { 
                stato: {type: "string", defaultValue: "Good"}
            }
        },
        renderer: {},
        onAfterRendering: function () {
            var id = this.getId();
            var obj = jQuery.sap.byId(id)[0];
            switch (this.getStato()) {
                case "Error":
                    obj.style.background = "#DC6774";
                    break;
                case "Warning":
                    obj.style.background = "#FFD300";
                    break;
                default:
                    obj.style.background = "#80C342";
                    break;
            }
        }
    });
    return CustomVBoxSin;
});