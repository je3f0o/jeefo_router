/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo_state.js
* Created at  : 2019-11-05
* Updated at  : 2020-01-04
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

const styles         = require("@jeefo/component/styles");
const Readonly       = require("@jeefo/utils/object/readonly");
const jeefo_template = require("@jeefo/template");
const PathFinder     = require("./path_finder");

const STRING_TEMPLATE = /{{([^}]+)}}/g;

const assign_error = property => {
    throw new Error(`${ property } property is assignable only once`);
};

class JeefoState {
    constructor (options) {
        this.query  = {};
        this.params = {};

        let nodes       = null;
        let url_pattern = null;
        let parent      = null;
        let path_finder = null;

        const { name, Controller } = options;

        const readonly = new Readonly(this);
        readonly.prop("name" , name);
        readonly.prop("Controller", Controller);

        readonly.prop("compare", other => {
            if (! path_finder) {
                throw new Error("Wrong state");
            }
            const { url }           = this;
            const { query, params } = other;

            const compare_query = key => url.query[key]  === query[key];
            const compare_param = key => url.params[key] === params[key];

            return (
                name === other.name &&
                path_finder.param_keys.every(compare_param) &&
                path_finder.query_keys.every(compare_query)
            );
        });

        readonly.prop("is_url_changed", url => {
            if (! path_finder) {
                throw new Error("Wrong state");
            }

            if (path_finder.param_keys.length) {
                const index = path_finder.param_keys.findIndex(key => {
                    return url.params[key] !== this.params[key];
                });
                if (index !== -1) { return true; }
            }

            if (path_finder.query_keys.length) {
                const index = path_finder.query_keys.findIndex(key => {
                    return url.query[key] !== this.query[key];
                });
                if (index !== -1) { return true; }
            }

            return false;
        });

        readonly.getter("nodes" , () => {
            if (! nodes) {
                if (Controller.style) {
                    styles.add_style(Controller.style, {
                        "state" : options.name
                    });
                }

                const t = Controller.template.replace(STRING_TEMPLATE, "${$1}");
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
