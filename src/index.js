/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2019-11-05
* Updated at  : 2021-03-07
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

const Readonly            = require("@jeefo/utils/object/readonly");
const EventEmitter        = require("@jeefo/utils/event_emitter");
const {definitions_table} = require("@jeefo/component");
const JeefoState          = require("./jeefo_state");

const find_by_url   = url  => state => state.path_finder.test(url);
const find_by_name  = name => ({ name:n }) => n === name;

const concat = (...args) => args.join('');

[
    { selector: "ui-view"          , filename: "ui_view"          } ,
    { selector: "ui-view--renderer", filename: "ui_view_renderer" }
].forEach(({selector, filename}) => {
    const filepath = `${ __dirname }/components/${ filename }`;
    definitions_table.register_component(selector, filepath);
});

const state_to_array = state => {
    const result = [];
    for (; state; state = state.parent) {
        result.unshift(state);
    }
    return result;
};

const set_local_params = state => {
    const { params:global_params, query:global_query } = state.url;
    const set_param = state => {
        return prop => state.params[prop] = global_params[prop];
    };
    const set_query = state => {
        return prop => state.query[prop] = global_query[prop];
    };

    for (; state; state = state.parent) {
        state.query  = {};
        state.params = {};
        state.path_finder.param_keys.forEach(set_param(state));
        state.path_finder.query_keys.forEach(set_query(state));
    }
};

class JeefoStateService extends EventEmitter {
    constructor () {
        super(true);
        let current_state  = null;
        //let is_initialized = false;

        const destroy_ui_event = state_name => {
            const event      = new Event("destroy_ui");
            event.state_name = state_name;
            this.emit(event.type, event);
        };

        const create_ui_event = state => {
            const event = new Event("create_ui");
            event.state = state;
            this.emit(event.type, event);
        };

        const replace_ui_event = states => {
            const event  = new Event("replace_ui");
            event.states = states;
            this.emit(event.type, event);
        };

        const find_changed_state = target_state => {
            const new_states  = state_to_array(target_state);
            const prev_states = state_to_array(current_state);

            for (let [i, new_state] of new_states.entries()) {
                const prev_state = prev_states[i];
                if (prev_state) {
                    const is_changed = (
                        prev_state !== new_state ||
                        prev_state.is_url_changed(target_state.url)
                    );
                    if (is_changed) {
                        return { prev_state, new_state };
                    }
                } else {
                    return { new_state };
                }
            }

            // Child state
            if (new_states.length < prev_states.length) {
                return { child_state : prev_states[new_states.length] };
            }
        };

        const trigger_event = states => {
            if (states.child_state) {
                destroy_ui_event(states.child_state.name);
            } else {
                if (states.prev_state) {
                    replace_ui_event(states);
                } else {
                    create_ui_event(states.new_state);
                }
            }
        };

        const states         = [];
        const pending_states = [];
        const readonly       = new Readonly(this);

        // Readony getters
        readonly.getter("states"        , () => states);
        readonly.getter("current_state" , () => current_state);

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

        // Patchable closure bounded methods...
        this.go = (url, history_state = "push") => {
            if (! url.startsWith(location.origin)) {
                if (! url.startsWith('/')) { url = `/${ url }`; }
                url = `${ location.origin }${ url }`;
            }

            url = new URL(url);
            const new_state = states.find(find_by_url(url));

            if (new_state) {
                if (current_state && current_state.name === new_state.name) {
                    return; // cancel
                }

                if (history_state === "pop") {
                    history.replaceState(null, null, url.href);
                } else {
                    history.pushState(null, null, url.href);
                }
                // TODO: PathFinder.parse() method parsing and assigning too.
                // That is not cool. Please make it better way...
                new_state.path_finder.parse(url);
                new_state.url = url;

                const event = new Event("change_state");
                event.state = new_state;
                this.emit(event.type, event);

                // Step 1. Find changed state
                const result = find_changed_state(new_state);
                if (result) {
                    current_state = new_state;
                    // Step 2. Set local params of each hierarchy states
                    set_local_params(new_state);

                    // Step 3. Trigger UI events
                    trigger_event(result);
                }
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
    const path = event.path || (event.composedPath && event.composedPath());
    const link = path.find(elem => elem.tagName === 'A');

    const is_local_link = (
        link &&
        link.hasAttribute("href") &&
        link.origin === location.origin
    );
    if (is_local_link) {
        event.preventDefault();
        router.go(link.href);
    }
});

window.addEventListener("popstate", () => {
    router.go(location.href, "pop");
});

module.exports = router;
