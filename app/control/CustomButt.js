sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Button",
    'jquery.sap.global'
], function (Control, Button, jQuery) {
    "use strict";
    var CustomButt = Button.extend("myapp.control.CustomButt", {

        metadata: {
            //eventi 
            events: {
                //evento di pressione tasto
                press: {
                    enablePreventDefault: true
                }
            },
            properties: {
                customType: {type: "string", defaultValue: ""},
                state: {type: "string", defaultValue: "0"},
                text: {type: "string", defaultValue: ""}
            }
        },
        renderer: function (oRm, oControl) {
            //Funzione che renderizza il testo 
            sap.m.ButtonRenderer.render(oRm, oControl);
        },
        onAfterRendering: function () {
            var oStateArray;
            var oType = this.getCustomType();
            var oState = this.getState();
            if (oType === "linea") {
                if (oState !== "") {
                    oStateArray = oState.split(".");
                    switch (oStateArray[0]) {
                        case "Disponibile":
                        {
                            jQuery.sap.byId(this.getId()).parent().removeClass("bordoLineaGrey");
                            jQuery.sap.byId(this.getId()).parent().addClass("bordoLineaGreen");
                            break;
                        }
                        case "Nondisponibile":
                            jQuery.sap.byId(this.getId()).parent().removeClass("bordoLineaGreen");
                            jQuery.sap.byId(this.getId()).parent().addClass("bordoLineaGrey");
                            break;
                    }
                    if (oStateArray[1]) {
                        switch (oStateArray[1]) {
                            case "Vuota":
                                jQuery.sap.byId(this.getId()).addClass("internoLineaWhite");
                                break;
                            case "Attrezzaggio":
                                jQuery.sap.byId(this.getId()).addClass("internoLineaYellow");
                                break;
                            case "Lavorazione":
                                jQuery.sap.byId(this.getId()).addClass("internoLineaGreen");
                                break;
                            case "Fermo":
                                jQuery.sap.byId(this.getId()).addClass("internoLineaRed");
                                break;
                            case "Svuotamento":
                                jQuery.sap.byId(this.getId()).addClass("internoLineaBordeaux");
                                break;
                        }
                    } else {
                        jQuery.sap.byId(this.getId()).removeClass("internoLineaBordeaux internoLineaRed internoLineaGreen internoLineaYellow internoLineaWhite");
                    }

                }
            }

            if (oType === "batch") {
                switch (oState) {
                    case "Non trasferito":
                        break;
                    case "In lavorazione":
                        jQuery.sap.byId(this.getId()).addClass("neroreno");
                        break;
//                    case "Chiuso":
//                        this.destroy();
//                        break;
                    case "Attrezzaggio":
                        jQuery.sap.byId(this.getId()).addClass("giallogallo");
                        break;
                    case "#ADD#":
                        this.setIcon("sap-icon://add");
                        this.attachPress("onAddItem");
                        break;

                }
            }







            if (oType === "confezionamento") {
                switch (oState) {
                    case "0":
//                        jQuery.sap.byId(this.getId()).addClass("bianconco");
                        break;
                    case "1":
//                        jQuery.sap.byId(this.getId()).addClass("bianconco");
                        this.setText("***");
                        break;
                    case "2":
                        jQuery.sap.byId(this.getId()).addClass("rossorso");
                        this.setText("***");
                        break;

                }
            }
            if (oType === "graficoSPC") {
                switch (oState) {
                    case "0":
                        jQuery.sap.byId(this.getId()).addClass("progressBarButtonYellow");
                        break;
                    case "1":
                        jQuery.sap.byId(this.getId()).addClass("internoLineaGreen");
//                        jQuery.sap.byId(this.getId()).addClass("progressBarButtonGreen");
                        break;
                }
            }

////            if (this.getDiff() === "1") {
//                this.addStyleClass('diffRed');
//            } else {
//                this.removeStyleClass('diffRed');
//                this.removeStyleClass('diffLink');
//            }
        }
    });
    return CustomButt;
});