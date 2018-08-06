sap.ui.define([
    'myapp/controller/Library'
], function (Library) {
    "use strict";
    return {
        TimeText: function (oText) {
            if (oText) {
                var array_time = oText.split(":");
                return Library.StringTime(Number(array_time[0])) + ":" + Library.StringTime(Number(array_time[1]));
            }
        }
    };
});

