/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ui_view.js
* Created at  : 2019-11-06
* Updated at  : 2019-11-24
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

const jqlite             = require("@jeefo/jqlite");
const compile            = require("@jeefo/component/compiler");
const StructureComponent = require("@jeefo/component/structure_component");
const router             = require("../index");

const prop_comment   = Symbol("$comment");
const prop_component = Symbol("component");

const create_new_child = async (state, component, $placeholder) => {
    const new_child = new StructureComponent(null, {
        binders          : [],
        dependencies     : [],
        Controller       : state.Controller,
        controller_name  : null,
        is_self_required : false,
    }, component);

    new_child.$element   = jqlite(`<ui-view name="${state.name}"></ui-view>`);
    component.state_name = state.name;

    component.children.push(new_child);
    await new_child.init();

    if (! new_child.is_destroyed) {
        const nodes = state.nodes.map(node => node.clone(true));
        const elements = await compile(nodes, new_child);

        elements.forEach(element => new_child.$element.append(element));
        $placeholder.after(new_child.$element);
    }
};

exports.type = "structure";

exports.style = `
    ui-view {
        display : block;
    }
`;

exports.controller = class UIView {
    constructor () { }

    async on_init ($element, component) {
        const $comment = jqlite(document.createComment(" UIView "));
        $element.before($comment);
        $element.remove();
        component.$element = null;

        this[prop_comment]   = $comment;
        this[prop_component] = component;

        let parent_ui = null;
        for (let c = component.parent; c; c = c.parent) {
            if (c.name === "ui-view") {
                parent_ui = c;
                break;
            }
        }

        this.on_create_ui = router.on("create_ui", async ({ state }) => {
            if (parent_ui) {
                const parent_state_name = state.parent && state.parent.name;
                if (parent_state_name === parent_ui.state_name) {
                    await create_new_child(state, component, $comment);
                    router.trigger("create_ui_success");
                }
            } else if (state.parent === null) {
                await create_new_child(state, component, $comment);
                router.trigger("create_ui_success");
            }
        });

        this.on_destroy_ui = router.on("destroy_ui", event => {
            if (component.state_name === event.state_name) {
                component.children[0].destroy();
                component.state_name = null;
                router.trigger("destroy_ui_success");
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
    }
};
