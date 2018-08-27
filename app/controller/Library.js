sap.ui.define([
    'jquery.sap.global',
    'sap/ui/model/json/JSONModel'
], function (JSONModel) {
    return {
        exp: null,
// FUNZIONI TEMPORALI 
        roundTo: function (value, decimalpositions) {
            var i = value * Math.pow(10, decimalpositions);
            i = Math.round(i);
            return i / Math.pow(10, decimalpositions);
        },
        MillisecsToStandard: function (val) {
            var hours = Math.floor(val / 1000 / 60 / 60);
            val -= hours * 1000 * 60 * 60;
            var mins = Math.floor(val / 1000 / 60);
            val -= mins * 1000 * 60;
            var secs = Math.floor(val / 1000);
            val -= secs * 1000;
            var string_hours, string_mins, string_secs;
            if (val !== 0) {
                console.log("C'è un problema");
            } else {
                string_hours = this.StringTime(hours);
                string_mins = this.StringTime(mins);
                string_secs = this.StringTime(secs);
            }
            return (string_hours + ":" + string_mins + ":" + string_secs);
        },
        DateToStandard: function (date) {
            var hours = this.StringTime(date.getHours());
            var mins = this.StringTime(date.getMinutes());
            var secs = this.StringTime(date.getSeconds());
            return (hours + ":" + mins + ":" + secs);
        },
        minutesToStandard: function (val) {
            var hours = Math.floor(val / 60);
            val -= hours * 60;
            var mins = val;
            var string_hours, string_mins;
            string_hours = this.StringTime(hours);
            string_mins = this.StringTime(mins);
            return (string_hours + ":" + string_mins);
        },
        SecondsToStandard: function (val) {
            var hours = Math.floor(val / 3600);
            val -= hours * 3600;
            var mins = Math.floor(val / 60);
            val -= mins * 60;
            var secs = val;
            var string_hours, string_mins, string_sec;
            string_hours = this.StringTime(hours);
            string_mins = this.StringTime(mins);
            string_sec = this.StringTime(secs);
            return (string_hours + ":" + string_mins + ":" + string_sec);
        },
        StringTime: function (val) {
            if (val < 10) {
                return  ('0' + String(val));
            } else {
                return  String(val);
            }
        },
        InvertStringTime: function (time) {
            var array = time.split("-");
            return array[2] + "/" + array[1] + "/" + array[0];
        },
        standardToMinutes: function (string) {
            return parseInt(string.split(":")[1], 10) + parseInt(string.split(":")[0], 10) * 60;
        },
        fromStandardToDate: function (data, ora) {
            var array_data = data.split("/");
            return array_data[2] + "-" + array_data[1] + "-" + array_data[0] + "T" + ora;
        },
        fromStandardToSeconds: function (string) {
            return parseInt(string.split(":")[2], 10) + parseInt(string.split(":")[1], 10) * 60 + parseInt(string.split(":")[0], 10) * 60 * 60;
        },
// FUNZIONI PER LA SUDDIVISIONE DEI GUASTI IN CAUSALIZZATI E NON


        AddTimeGaps: function (data) {
            var millisec_diff = [];
            var start, end;
            for (var iter in data.fermi) {
                start = new Date(data.fermi[iter].inizio);
                end = new Date(data.fermi[iter].fine);
                millisec_diff.push(end - start);
                data.fermi[iter].inizio = this.DateToStandard(start);
                data.fermi[iter].fine = this.DateToStandard(end);
            }
            var temp;
            var sum = 0;
            var arrayGaps = [];
            for (iter in millisec_diff) {
                temp = millisec_diff[iter];
                sum += temp;
                arrayGaps.push(this.MillisecsToStandard(temp));
            }
            for (var i = 0; i < arrayGaps.length; i++) {
                data.fermi[i].intervallo = arrayGaps[i];
            }
            data.Totale = {};
            data.Totale.tempoGuastoTotale = this.MillisecsToStandard(sum);
            data.Totale.causaleTotale = "";
            return data;
        },
        AddTimeGapsFermiProgrammati: function (data) {
            var millisec_diff = [];
            var start, end;
            for (var iter in data.nondisponibilita) {
                start = new Date(data.nondisponibilita[iter].inizio);
                end = new Date(data.nondisponibilita[iter].fine);
                millisec_diff.push(end - start);
                data.nondisponibilita[iter].inizio = this.DateToStandard(start);
                data.nondisponibilita[iter].fine = this.DateToStandard(end);
            }
            var temp;
            var sum = 0;
            var arrayGaps = [];
            for (iter in millisec_diff) {
                temp = millisec_diff[iter];
                sum += temp;
                arrayGaps.push(this.MillisecsToStandard(temp));
            }
            for (var i = 0; i < arrayGaps.length; i++) {
                data.nondisponibilita[i].intervallo = arrayGaps[i];
            }
            data.Totale = {};
            data.Totale.tempoGuastoTotale = this.MillisecsToStandard(sum);
            data.Totale.causaleTotale = "";
            return data;
        },
        RemoveCaused: function (data) {
            for (var i = data.fermi.length - 1; i >= 0; i--) {
                if (data.fermi[i].causale !== "") {
                    data.fermi.splice(i, 1);
                }
            }
            return data;
        },
        RemoveClosingButtons: function (tab_id) {
            var tabContainer = this.getView().byId(tab_id);
            var n_tabs = tabContainer.getAggregation("_tabStrip").getItems().length;
            var oTabStrip = tabContainer.getAggregation("_tabStrip");
            var oItems = oTabStrip.getItems();
            for (var i = 0; i < n_tabs; i++) {
                var oCloseButton = oItems[i].getAggregation("_closeButton");
                oCloseButton.setVisible(false);
            }
            tabContainer.getAggregation("_tabStrip").getAggregation("_select").setVisible(false);
        },
        AjaxCallerVoid: function (address, Func) {
            var req = jQuery.ajax({
                url: address,
                async: true
            });
            req.always(Func);
        },
        AjaxCallerData: function (addressOfJSON, successFunc, errorFunc) {
            jQuery.ajax({
                url: addressOfJSON,
                method: "GET",
                dataType: "xml",
                async: true,
                success: jQuery.proxy(this.WrapperSuccessFunc, this, successFunc),
                error: errorFunc
            });
        },
        SyncAjaxCallerVoid: function (address, Func) {
            var req = jQuery.ajax({
                url: address,
                async: false
            });
            req.always(Func);
        },
        SyncAjaxCallerData: function (addressOfJSON, successFunc, errorFunc) {
            jQuery.ajax({
                url: addressOfJSON,
                method: "GET",
                dataType: "xml",
                async: false,
                success: jQuery.proxy(this.WrapperSuccessFunc, this, successFunc),
                error: errorFunc
            });
        },
        WrapperSuccessFunc: function (successFunc, Jdata) {
            if (jQuery.isXMLDoc(Jdata)) {
                Jdata = JSON.parse(Jdata.documentElement.textContent);
            }
            successFunc(Jdata);
        },
//FUNZIONI RICORSIVE PER LA TREETABLE        
        RecursiveJSONComparison: function (std, bck, arrayName) {
            var tempJSON;
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    if (typeof std === "undefined") {
                        tempJSON = {};
                    } else {
                        tempJSON = std[key];
                    }
                    bck[key] = this.RecursiveJSONComparison(tempJSON, bck[key], arrayName);
                } else {
                    if (key === "value") {
                        if (typeof std === "undefined") {
                            if (bck.expand !== 3) {
                                bck.expand = 2;
                            }
                        } else {
                            if (((typeof std[key] === "undefined") || (bck[key] !== std[key])) && bck.expand !== 3) {
                                bck.expand = 2;
                            }
                        }
                    }
                }
            }
            return bck;
        },
        RecursiveLinkRemoval: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveLinkRemoval(json[key]);
                } else {
                    if (key === "expand") {
                        if (json[key] === 3) {
                            json[key] = 0;
                        }
                    }
                }
            }
            return json;
        },
        RecursiveParentExpansion: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    this.exp = 0;
                    json[key] = this.RecursiveJSONExpansionFinder(json[key]);
                    if (typeof json[key].expand !== "undefined" && json[key].expand === 0) {
                        json[key].expand = this.exp;
                    }
                    json[key] = this.RecursiveParentExpansion(json[key]);
                }
            }
            return json;
        },
        RecursiveModifyExpansion: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveModifyExpansion(json[key]);
                } else {
                    if (key === "modify" || key === "code") {
                        if (json[key] === 1) {
                            json.expand = 1;
                        }
                    }
                }
            }
            return json;
        },
        RecursivePropertyAdder: function (json, prop_name) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursivePropertyAdder(json[key], prop_name);
                } else {
                    json[prop_name] = "";
                }
            }
            return json;
        },
        RecursivePropertyCopy: function (data, P1, P2) {
            for (var key in data) {
                if (typeof data[key] === "object") {
                    data[key] = this.RecursivePropertyCopy(data[key], P1, P2);
                } else {
                    data[P1] = data[P2];
                }
            }
            return data;
        },
        RecursiveJSONTimeConversion: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveJSONTimeConversion(json[key]);
                } else {
                    if (key === "data") {
                        json[key] = this.InvertStringTime(json[key]);
                    }
                }
            }
            return json;
        },
        RecursiveJSONExpansionFinder: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveJSONExpansionFinder(json[key]);
                } else {
                    if (key === "expand") {
                        if (json[key] > 0) {
                            this.exp = 1;
                        }
                    }
                }
            }
            return json;
        },
        RecursiveJSONChangesFinder: function (setup) {
            var temp = {};
            for (var key in setup) {
                if (typeof setup[key] === "object") {
                    setup[key] = this.RecursiveJSONChangesFinder(setup[key]);
                } else {
                    if (typeof setup.code !== "undefined") {
                        if (setup.code === 1 || setup.modify === 1) {
                            if (setup.code === 1) {
                                if (setup.codePlaceholder === "Lotto") {
                                    temp.Type = "l";
                                } else if (setup.codePlaceholder === "Matricola") {
                                    temp.Type = "m";
                                }
                            } else if (setup.modify === 1) {
                                temp.Type = "v";
                            }
                            temp.IDParametro = setup.IDParametro;
                            temp.ValueML = setup.codeValue;
                            temp.Value = setup.valueModify;
                            if (temp !== this.dataXML[this.dataXML.length - 1]) {
                                this.dataXML.push(temp);
                            }
                        }
                    }
                }
            }
            return setup;
        },
//CREAZIONE DEI FILE XML PER LA PARTE DI BACKEND
        createXMLFermo: function (obj) {
            var top = '<root>';
            var bottom = '</root>';
            var parameters = '<caso>' + obj.caso + '</caso>' +
                    '<logId>' + obj.logId + '</logId>' +
                    '<batchId>' + obj.batchId + '</batchId>' +
                    '<dataFine>' + obj.dataFine + '</dataFine>' +
                    '<dataInizio>' + obj.dataInizio + '</dataInizio>' +
                    '<causaleId>' + obj.causaleId + '</causaleId>';
            return this.EncodeForUri(top + parameters + bottom);
        },
        createXMLBatch: function (obj) {
            var top = '<root>';
            var bottom = '</root>';
            var parameters = '<pianoDiConfezionamentoId>' + obj.pianodiconfezionamento + '</pianoDiConfezionamentoId>' +
                    '<lineaId>' + obj.lineaId + '</lineaId>';
            if (obj.batchId) {
                parameters += '<batchId>' + obj.batchId + '</batchId>';
            } else {
                parameters += '<batchId>' + '</batchId>';
            }
//            parameters += '<SKUCodiceInterno>' + obj.SKUCodiceInterno + '</SKUCodiceInterno>';
            parameters += '<SKUCodiceInterno></SKUCodiceInterno>';
            parameters += '<formatoProduttivo>' + obj.formatoProduttivo + '</formatoProduttivo>' +
                    '<grammatura>' + obj.grammatura + '</grammatura>' +
                    '<sequenza>' + obj.sequenza + '</sequenza>' +
                    '<tipologia>' + obj.tipologia + '</tipologia>' +
                    '<destinazione>' + this.EncodeXMLSpecial(obj.destinazione) + '</destinazione>' +
                    '<qliTeo>' + obj.quintali + '</qliTeo>' +
                    '<cartoniTeo>' + obj.cartoni + '</cartoniTeo>' +
                    '<oreTeo>' + obj.ore + '</oreTeo>';
            return this.EncodeForUri(top + parameters + bottom);
        },
        createXMLDestinazione: function (obj) {
            var top = '<root><pianoDiConfezionamentoId/>';
            var bottom = '<sequenza/> <qliTeo/><cartoniTeo/><oreTeo/></root>';
            var parameters = '<lineaId>' + obj.lineaID + '</lineaId>';
//            parameters += '<SKUCodiceInterno>' + obj.SKUCodiceInterno + '</SKUCodiceInterno>';
            parameters += '<SKUCodiceInterno></SKUCodiceInterno>';
            parameters += '<formatoProduttivo>' + obj.formatoProduttivo + '</formatoProduttivo>' +
                    '<grammatura>' + obj.grammatura + '</grammatura>' +
                    '<tipologia>' + obj.tipologia + '</tipologia>';
            return this.EncodeForUri(top + parameters + bottom);
        },
        XMLSetupUpdates: function (setup, idLinea, idSKU) {
            var heading = "<Parameters>" +
                    "<LineaID>" + idLinea + "</LineaID>" +
                    "<SKUID>" + idSKU + "</SKUID>" +
                    "<ParameterList>";
            var bottom = "</ParameterList>" +
                    "</Parameters>";
            this.dataXML = [];
            setup = this.RecursiveJSONChangesFinder(setup);
            var body = "";
            for (var i in this.dataXML) {
                body += "<Parameter>";
                for (var key in this.dataXML[i]) {
                    body += "<" + key + ">" + String(this.dataXML[i][key]) + "</" + key + ">";
                }
                body += "</Parameter>";
            }
            return this.EncodeForUri(heading + body + bottom);
        },
        XMLSetupUpdatesCT: function (setup, idBatch) {
            var heading = "<Parameters>" +
                    "<BatchID>" + idBatch + "</BatchID>" +
                    "<ParameterList>";
            var bottom = "</ParameterList>" +
                    "</Parameters>";
            this.dataXML = [];
            setup = this.RecursiveJSONChangesFinder(setup);
            var body = "";
            for (var i in this.dataXML) {
                body += "<Parameter>";
                for (var key in this.dataXML[i]) {
                    body += "<" + key + ">" + String(this.dataXML[i][key]) + "</" + key + ">";
                }
                body += "</Parameter>";
            }
            return this.EncodeForUri(heading + body + bottom);
        },
        EncodeXMLSpecial: function (string) {
            string = this.ReplaceAll('<', '&#60;', string);
            string = this.ReplaceAll('>', '&#62;', string);
            string = this.ReplaceAll('&', '&#38;', string);
            string = this.ReplaceAll('"', '&#34;', string);
            string = this.ReplaceAll("'", '&#39;', string);
            return string;
        },
        EncodeForUri: function (string) {
            string = this.ReplaceAll('!', '%21', string);
            string = this.ReplaceAll('#', '%23', string);
            string = this.ReplaceAll('$', '%24', string);
            string = this.ReplaceAll('&', '%26', string);
            string = this.ReplaceAll("'", '%27', string);
            string = this.ReplaceAll('(', '%28', string);
            string = this.ReplaceAll(')', '%29', string);
            string = this.ReplaceAll('*', '%2A', string);
            string = this.ReplaceAll('+', '%2B', string);
            string = this.ReplaceAll(',', '%2C', string);
            string = this.ReplaceAll('/', '%2F', string);
            string = this.ReplaceAll(':', '%3A', string);
            string = this.ReplaceAll(';', '%3B', string);
            string = this.ReplaceAll('=', '%3D', string);
            string = this.ReplaceAll('?', '%3F', string);
            string = this.ReplaceAll('@', '%40', string);
            string = this.ReplaceAll('[', '%5B', string);
            string = this.ReplaceAll(']', '%5D', string);
            return string;
        },
        ReplaceAll: function (stringToFind, stringToReplace, string) {
            if (stringToFind === stringToReplace)
                return string;
            var temp = string;
            var index = temp.indexOf(stringToFind);
            while (index !== -1 && temp[index + 1] !== '#') {
                temp = temp.replace(stringToFind, stringToReplace);
                index = temp.indexOf(stringToFind);
            }
            return temp;
        }
    };
});
