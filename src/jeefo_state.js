/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo_state.js
* Created at  : 2019-11-05
* Updated at  : 2019-11-19
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

const Readonly       = require("@jeefo/utils/object/readonly");
const jeefo_template = require("@jeefo/template");
const PathFinder     = require("./path_finder");

const STRING_TEMPLATE = /{{([^}]+)}}/g;

const assign_error = property => {
    throw new Error(`${ property } property is assignable only once`);
};

class JeefoState {
    constructor (options) {
        this.params = {};

        let nodes       = null;
        let url_pattern = null;
        let parent      = null;
        let path_finder = null;
        //let url_matcher = null;

        const template = options.template;

        const readonly = new Readonly(this);
        readonly.prop("name" , options.name);
        readonly.prop("style" , options.style);
        readonly.prop("template" , template);
        readonly.prop("Controller" , options.Controller);

        readonly.getter("nodes" , () => {
            if (! nodes) {
                const t = template.replace(STRING_TEMPLATE, "${$1}");
                nodes = jeefo_template.parse(t);
            }

            return nodes;
        });

        // Getter
        readonly.getter("path_finder", () => path_finder);

        readonly.getter_setter("url_pattern", {
            get : () => url_pattern,
            set : value => {
                if (url_pattern) { assign_error(url_pattern); }
                url_pattern = value;

                path_finder = new PathFinder(url_pattern);
            }
        });

        readonly.getter_setter("parent", {
            get : () => parent,
            set : value => {
                if (parent) { assign_error(parent); }
                parent = value;
            }
        });
    }
}

module.exports = JeefoState;
