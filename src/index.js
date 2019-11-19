/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
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

const Readonly          = require("@jeefo/utils/object/readonly");
const EventEmitter      = require("@jeefo/utils/event_emitter");
const definitions_table = require("@jeefo/component");
const JeefoState        = require("./jeefo_state");

const find_by_path  = url  => state => state.path_finder.test(url);
const find_by_name  = name => ({ name:n }) => n === name;
const compare_props = (s1, s2) => prop => s1.params[prop] === s2.params[prop];

const concat = (...args) => args.join('');

const ui_path = `${ __dirname }/components/ui_view`;
definitions_table.register_component("ui-view", ui_path);

const set_local_params = state => {
    const { params } = state;
    const set_params = state => {
        return prop => {
            state.params[prop] = params[prop];
        };
    };

    for (let s = state.parent; s; s = s.parent) {
        s.params = {};
        s.path_finder.params.forEach(set_params(s));
    }
};

class JeefoStateService extends EventEmitter {
    constructor () {
        super(true);
        let prev_states    = [];
        let current_state  = null;
        let is_initialized = false;

        const trigger_event = () => {
            const current_states = [];
            for (let s = current_state; s; s = s.parent) {
                current_states.unshift({
                    name     : s.name,
                    props    : s.path_finder.params,
                    params   : s.params,
                    instance : s,
                });
            }

            if (current_states.length < prev_states.length) {
                for (let [i, s1] of current_states.entries()) {
                    const s2 = prev_states[i];
                    const is_changed = (
                        s1.name !== s2.name ||
                        ! s1.props.every(compare_props(s1, s2))
                    );

                    if (is_changed) {
                        const event = new Event("change_ui");
                        event.state      = s1.instance;
                        event.state_name = s2.name;
                        return this.emit(event.type, event);
                    }
                }

                const event      = new Event("destroy_ui");
                event.state_name = prev_states[current_states.length].name;
                this.emit(event.type, event);
            } else {
                for (let [i, s1] of prev_states.entries()) {
                    const s2 = current_states[i];
                    const is_changed = (
                        s1.name !== s2.name ||
                        ! s1.props.every(compare_props(s1, s2))
                    );

                    if (is_changed) {
                        const event = new Event("change_ui");
                        event.state      = s2.instance;
                        event.state_name = s1.name;
                        return this.emit(event.type, event);
                    }
                }

                if (is_initialized) {
                    const state = current_states[prev_states.length];
                    if (state) {
                        const event = new Event("create_ui");
                        event.state = state.instance;
                        this.emit(event.type, event);
                    }
                } else {
                    is_initialized = true;
                }
            }
        };

        const states         = [];
        const pending_states = [];
        const readonly       = new Readonly(this);

        // Readony getters
        readonly.getter("states"         , () => states);
        readonly.getter("current_state"  , () => current_state);
        readonly.getter("is_initialized" , () => is_initialized);

        // Readonly methods
        readonly.prop("register", (state_name, Controller) => {
            const find_by_state_name = find_by_name(state_name);
            if (states.find(find_by_state_name)) {
                throw new Error("Duplicated state name");
            }

            const on_init = Controller.prototype.on_init;
            if (on_init) {
                Controller.prototype.on_init = function ($element) {
                    on_init.call(this, $element, current_state);
                };
            }

            const state = new JeefoState({
                name        : state_name,
                style       : Controller.style,
                template    : Controller.template,
                Controller  : Controller,
            });

            const state_names = state_name.split('.');

            if (state_names.length > 1) {
                state_names.pop();
                const parent_name = state_names.join('.');
                const parent = states.find(find_by_name(parent_name));

                if (parent) {
                    state.parent      = parent;
                    state.url_pattern = concat(
                        parent.url_pattern, Controller.url
                    );
                    states.push(state);

                    let index = pending_states.findIndex(find_by_state_name);
                    while (index >= 0) {
                        const child = pending_states[index].state;
                        child.parent      = state;
                        child.url_pattern = concat(
                            state.url_pattern, child.Controller.url
                        );

                        states.push(child);
                        pending_states.splice(index, 1);
                        index = pending_states.findIndex(find_by_state_name);
                    }
                } else {
                    pending_states.push({
                        name  : parent_name,
                        state : state
                    });
                }
            } else {
                state.url_pattern = Controller.url;
                states.push(state);
            }
        });

        readonly.prop("init", () => {
            if (! is_initialized) {
                is_initialized = true;
            }
        });

        // Patchable closure bounded methods...
        this.go = (url, history_state = "push") => {
            if (! url.startsWith(location.origin)) {
                if (! url.startsWith('/')) { url = `/${ url }`; }
                url = `${ location.origin }${ url }`;
            }

            url = new URL(url);
            const state = states.find(find_by_path(url.pathname));

            if (state) {
                const event = new Event("change_state");
                event.state = state;
                this.emit(event.type, event);

                if (current_state) {
                    prev_states = [];
                    for (let s = current_state; s; s = s.parent) {
                        prev_states.unshift({
                            name   : s.name,
                            props  : s.path_finder.params,
                            params : s.params,
                        });
                    }
                }

                state.url           = url;
                state.params        = state.path_finder.parse(url.pathname);
                state.history_state = history_state;
                set_local_params(state);

                current_state = state;
                trigger_event();
            } else {
                console.log(`Not found. '${ url }'`);
            }
        };

        const change_state_success_handler = () => {
            const event         = new Event("change_state_succeed");
            event.url           = current_state.url.href;
            event.history_state = current_state.history_state;
            this.emit(event.type, event);
        };

        this.on("change_ui_success"  , change_state_success_handler);
        this.on("create_ui_success"  , change_state_success_handler);
        this.on("destroy_ui_success" , change_state_success_handler);

        this.on("change_state_succeed", event => {
            if (event.history_state === "push") {
                history.pushState(null, null, event.url);
            } else {
                history.replaceState(null, null, event.url);
            }
        });
    }
}

const router = new JeefoStateService();

window.addEventListener("click", event => {
    const is_local_link = (
        event.target.tagName === 'A' &&
        event.target.origin  === location.origin
    );
    if (is_local_link) {
        event.preventDefault();
        router.go(event.target.href);
    }
});

window.addEventListener("popstate", () => {
    router.go(location.href, "pop");
});

module.exports = router;
