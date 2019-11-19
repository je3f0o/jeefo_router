/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : state_service.js
* Created at  : 2019-11-05
* Updated at  : 2019-11-05
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const Readonly = require("@jeefo/utils/object/readonly");

class JeefoStateService {
    constructor () {
        const states = [];

        const readonly = new Readonly(this);
        readonly.prop("get_name", instance => {
            const find_by_instance = ({ instance:s }) => s === instance;
            return (states.find(find_by_instance) || {}).name || null;
        });
    }
}

module.exports = new JeefoStateService();
