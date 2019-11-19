/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : path_finder.js
* Created at  : 2019-11-05
* Updated at  : 2019-11-18
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// Боломжит сонголтууд
// [optional]   - ideally optional url segment but not implemented.
// :major(\\d+) - `state.params`'s property with regex
// :id          - `state.params`'s property name
// ?query&      - ideally `state.query`'s property name but not implemented.

// ignore:end

const Readonly = require("@jeefo/utils/object/readonly");

const escape_regex = str => str.replace(/([-\/\\^$*+?.()|[\]{}])/g, "\\$1");

const VAR_REGEX   = /(\:[^\:\/\?]+)/g;
const var_handler = name => (params, value) => params[name] = value;

const build_regex_string = url_string => {
    const replacements = [];
    for (let r; (r = VAR_REGEX.exec(url_string));) {
        const param_name = r[0].slice(1);
        replacements.push({
            from    : r.index,
            to      : VAR_REGEX.lastIndex,
            regex   : "([^\/\?]+)",
            param   : param_name,
            handler : var_handler(param_name),
        });
    }

    let index      = replacements.length;
    let last_index = url_string.length;
    while (index--) {
        const { from, to, regex } = replacements[index];

        let head = url_string.slice(0, from);
        if (index === 0) {
            // escape string first part
            head = escape_regex(head);
        }

        // escape string between replacements
        const delta_length = last_index - to;
        const str  = escape_regex(url_string.slice(to, to + delta_length));
        const tail = `${ str }${ url_string.slice(to + delta_length) }`;
        last_index = from;

        url_string = `${ head }${ regex }${ tail }`;
    }

    // We can add options to config for case sensitive or not
    const regex = new RegExp(`^${ url_string }$`);
    const params   = Object.freeze(replacements.map(({ param:p }) => p));
    const handlers = replacements.map(({ handler:h }) => h);
    return { regex, params, handlers };
};

class PathFinder {
    constructor (url_pattern) {
        const { regex, params, handlers } = build_regex_string(url_pattern);

        const readonly = new Readonly(this);

        readonly.prop("regex"  , regex);
        readonly.prop("params" , params);

        readonly.prop("test", url_string => {
            return regex.test(url_string);
        });

        readonly.prop("parse", url_string => {
            const params = {};
            let matches = url_string.match(this.regex);

            handlers.forEach((assigner, i) => {
                assigner(params, matches[i+1]);
            });

            return params;
        });
    }
}

module.exports = PathFinder;

if (require.main === module) {
    const pf  = new PathFinder("/:x/:y/:z");
    const url = "/21/11/a";

    console.log(pf);
    console.log(`URL '${ url }' is matched:`, pf.regex.test(url));
    if (pf.regex.test(url)) {
        const params = pf.parse(url);
        console.log("params:", params);
    }
}
