sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/ComboBox",
    'jquery.sap.global'
], function (Control, ComboBox, jQuery) {
    "use strict";
    var CustomAddComboBox = ComboBox.extend("myapp.control.CustomAddComboBox", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {}
        },
        renderer: {},
        onAfterRendering: function () {
            ComboBox.prototype.onAfterRendering.apply(this, arguments);
            if (this.getValue() === "#ADD#" || this.getValue() === "#ADD# #ADD#gr") {
                this.setVisible(false);
            }
        }
    });
    return CustomAddComboBox;
});