/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : main_state.js
* Created at  : 2019-11-05
* Updated at  : 2019-11-06
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

class MainState {
    static get url      () { return '/'; }
    static get style    () { return '';  }
    static get template () {
        return `
            { jt }
            someTemplate +
            uiView
        `;
    }

    constructor ($element) {
    }
}

module.exports = MainState;
