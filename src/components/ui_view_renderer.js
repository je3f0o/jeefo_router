/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ui_view_element.js
* Created at  : 2019-12-02
* Updated at  : 2020-06-06
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

exports.template = element => {
    const new_element = document.createElement("ui-view");
    for (const attr of element.attributes) {
        new_element.setAttribute(attr.name, attr.value);
    }
    while (element.firstChild) {
        const node = element.removeChild(element.firstChild);
        new_element.appendChild(node);
    }
    return new_element;
};
