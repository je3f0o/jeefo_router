/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2019-11-05
* Updated at  : 2019-11-29
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

const find_by_url   = url  => state => state.path_finder.test(url);
const find_by_name  = name => ({ name:n }) => n === name;

const concat = (...args) => args.join('');

const state_to_array = state => {
    const result = [];
    for (; state; state = state.parent) {
        result.unshift(state);
    }
    return result;
};

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
        s.path_finder.param_keys.forEach(set_params(s));
    }
};

class JeefoStateService extends EventEmitter {
    constructor () {
        super(true);
        let current_state  = null;
        let is_initialized = false;

        const destroy_ui_event = state_name => {
            const event      = new Event("destroy_ui");
            event.state_name = state_name;
            this.emit(event.type, event);
        };

        const create_ui_event = state => {
            const event = new Event("create_ui");
            state.query  = state.url.query;
            state.params = state.url.params;
            event.state = state;
            this.emit(event.type, event);
        };

        const trigger_event = (new_state) => {
            const prev_states    = state_to_array(current_state);
            const current_states = state_to_array(new_state);
            current_state = new_state;

            if (current_states.length < prev_states.length) {
                for (let [i, current_state] of current_states.entries()) {
                    const prev_state = prev_states[i];
                    if (! current_state.compare(prev_state)) {
                        destroy_ui_event(prev_state.name);
                        create_ui_event(current_state);
                        return;
                    }
                }

                destroy_ui_event(prev_states[current_states.length].name);
            } else {
                for (let [i, prev_state] of prev_states.entries()) {
                    const current_state = current_states[i];
                    if (! current_state.compare(prev_state)) {
                        destroy_ui_event(prev_state.name);
                        create_ui_event(current_state);
                        return;
                    }
                }

                if (is_initialized) {
                    const state = current_states[prev_states.length];
                    if (state) {
                        create_ui_event(state);
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
                Controller.prototype.on_init = async function ($element) {
                    await on_init.call(this, $element, current_state);
                };
            }

            const state = new JeefoState({
                name       : state_name,
                Controller : Controller,
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
            const state = states.find(find_by_url(url.pathname));

            if (state) {
                if (history_state === "pop") {
                    history.replaceState(null, null, url.href);
                } else {
                    history.pushState(null, null, url.href);
                }
                const event = new Event("change_state");
                event.state = state;
                this.emit(event.type, event);

                state.url = url;
                state.path_finder.parse(url);
                set_local_params(state);

                trigger_event(state);
            } else {
                const event = new Event("change_state_failed");
                event.url = url;
                this.emit(event.type, event);
            }
        };

        const change_state_success_handler = () => {
            this.trigger("change_state_succeed");
        };

        this.on("change_ui_success"  , change_state_success_handler);
        this.on("create_ui_success"  , change_state_success_handler);
        this.on("destroy_ui_success" , change_state_success_handler);
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
