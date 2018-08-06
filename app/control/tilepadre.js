sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/StandardTile",
    'jquery.sap.global',
    'sap/ui/core/ValueStateSupport'
], function (Control, StandardTile, jQuery, ValueStateSupport) {
    "use strict";
    var tilepadre = StandardTile.extend("myapp.control.tilepadre", {

        metadata: {
            //eventi 
            events: {

            },
            properties: {
                idz: {type: "string", defaultValue: ""}
            },
            defaultAggregation: "myapp.control.CustomTilez",

            aggregations: {
                items: {
                    type: "myapp.control.CustomTilez",
                    multiple: true,
                    singularName: "item",
                    bindable: "bindable"
                }
            }
        },

        renderer: function (oRM, oControl) {
            var items = oControl.getItems(true);
            console.log(items);
            var i;
            for (i = 0; i < items.length; i++) {
                oRM.write("<div");
                oRM.writeControlData(oControl);
                oRM.write("</div>");
                oRM.renderControl(items[i]);
            }
        },
        onAfterRendering: function () {
        }
    });
    return tilepadre;
});/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


