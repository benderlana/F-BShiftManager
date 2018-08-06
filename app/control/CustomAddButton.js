sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    var CustomAddButton = Button.extend("myapp.control.CustomAddButton", {

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
            Button.prototype.onAfterRendering.apply(this, arguments);
            this.setVisible(true);
            if (this.getText() === "#ADD#") {
                this.setVisible(false);
            }
        }
    });
    return CustomAddButton;
});