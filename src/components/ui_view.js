/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ui_view.js
* Created at  : 2019-11-06
* Updated at  : 2020-11-24
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

const jqlite    = require("@jeefo/jqlite");
const router    = require("../index");
const {compile} = require("@jeefo/component");

const prop_comment   = Symbol("$comment");
const prop_component = Symbol("component");

const create_new_child = async (state, component, $placeholder) => {
    // clone attributes
    let attrs = [];
    for (const attr of component.element.attributes) {
        attrs.push(`${attr.name}="${attr.value}"`);
    }
    attrs = attrs.length ? ' ' + attrs.join(' ') : '';
    const tag      = "ui-view--renderer";
    const template = `<${tag}${attrs}>${state.template}</${tag}>`;
    await compile(template, component, false);
    const new_child = component.children[0];

    if (! new_child.is_destroyed) {
        new_child.Controller = state.Controller;
        component.state_name = state.name;
        if (state.controller_name) {
            new_child.controller_name = state.controller_name;
        }

        await new_child.initialize();

        if (! new_child.is_destroyed) {
            $placeholder.after(new_child.$element);
            // `new_child` can be already rendered because of parent_ui's
            // `trigger_render()`
            if (component.is_rendered && ! new_child.is_rendered) {
                new_child.trigger_render();
            }
        }
    }
};

exports.type = "structure";

exports.style = `
/* sass */
ui-view
    width   : 100%
    height  : 100%
    display : block
`;

exports.controller = class UIView {
    async on_init ($element, component) {
        const $comment = jqlite(new Comment(" UIView "));
        $element.before($comment);
        $element.remove();

        this[prop_comment]   = $comment;
        this[prop_component] = component;

        let parent_ui = null;
        for (let c = component.parent; c; c = c.parent) {
            if (c.name === "ui-view") {
                parent_ui = c;
                break;
            }
        }

        const create_ui = async ({state}) => {
            if (parent_ui) {
                const parent_state_name = state.parent && state.parent.name;
                if (parent_state_name === parent_ui.state_name) {
                    await create_new_child(state, component, $comment);
                    router.trigger("create_ui_success");
                }
            } else if (state.parent === null) {
                event.is_locked = true;
                await create_new_child(state, component, $comment);
                router.trigger("create_ui_success");
            }
        };

        const destroy_ui = () => {
            component.children[0].destroy();
            component.state_name = null;
            router.trigger("destroy_ui_success");
        };

        this.on_create_ui  = router.on("create_ui" , create_ui);
        this.on_destroy_ui = router.on("destroy_ui", ({state_name}) => {
            if (component.state_name === state_name) destroy_ui();
        });
        this.on_replace_ui = router.on("replace_ui", async ({states}) => {
            if (component.is_destroyed) return;
            if (states.prev_state.name === component.state_name) {
                destroy_ui();
                create_ui({state: states.new_state});
            }
        });

        if (parent_ui) {
            if (parent_ui.state_name !== router.current_state.name) {
                let state = router.current_state;
                while (state.parent) {
                    if (state.parent.name === parent_ui.state_name) { break; }
                    state = state.parent;
                }
                await create_new_child(state, component, $comment);
            }
        } else { // it means root ui
            let state = router.current_state;
            while (state.parent) {
                state = state.parent;
            }
            await create_new_child(state, component, $comment);
        }
    }

    on_destroy () {
        router.off("create_ui" , this.on_create_ui);
        router.off("destroy_ui", this.on_destroy_ui);
        router.off("replace_ui", this.on_replace_ui);
    }
};
