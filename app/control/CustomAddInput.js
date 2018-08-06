sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Input",
    'jquery.sap.global'
], function (Control, Input, jQuery) {
    "use strict";
    var CustomAddInput = Input.extend("myapp.control.CustomAddInput", {

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
            Input.prototype.onAfterRendering.apply(this, arguments);
            if (this.getValue() === "#ADD#") {
                this.setVisible(false);
            }
        }
    });
    return CustomAddInput;
});