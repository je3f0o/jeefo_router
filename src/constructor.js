/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : constructor.js
* Created at  : 2017-09-09
* Updated at  : 2017-10-07
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var	$q                        = require("jeefo/q"),
	resolve                   = require("./resolve"),
	$animator                 = require("jeefo/animate"),
	Directive                 = require("jeefo/component/directive"),
	constructor               = require("jeefo/component/constructor"),
	compile_nodes             = require("jeefo/component/compiler/nodes"),
	compile_template          = require("jeefo/component/compiler/template"),
	template_resolver         = require("./template_resolver"),
	make_directive_controller = require("jeefo/component/make_directive_controller");

module.exports = function state_constructor (ctrl, component, state) {
	if (state.parent) {
		state.parent.children.push(state);
	}

	var state_definition = state.definition;

	// Active
	ctrl.$state         = state;
	ctrl.$is_activated  = state.is_activated = true;
	ctrl.reference.name = state.name;

	if (state_definition.controller && ! state_definition.controller.Controller) {
		make_directive_controller(state_definition.controller);
	}

	return $q.when().
		// Resolve view template
		then(function () {
			return compile_template(ctrl.view_template, component);
		}).
		// Resolve template
		then(function (fragment) {
			ctrl.$view_element = fragment.firstChild;
			return template_resolver(state_definition);
		}).
		// Resolve controller
		then(function (nodes) {
			ctrl.nodes = nodes;
			return resolve(ctrl, component, state_definition);
		}).
		// Construct
		then(function (args) {
			var element    = ctrl.$view_element,
				_component = component.children[component.children.length - 1];

			if (state_definition.controller) {
				_component.controller = new state_definition.controller.Controller();
				if (_component.controller.on_init) {
					_component.controller.on_init.apply(_component.controller, args);
				}
				_component.controller_as = state.controller_as || "$view";
			}

			_component.attrs.values = component.attrs.values;

			var directives = component.directives, i = directives.length;
			while (i--) {
				_component.directives[i] = new Directive(
					directives[i].name, directives[i].definition
				);
				constructor(_component, component.directives[i]);
			}

			return compile_nodes(ctrl.nodes, _component).then(function (fragment) {
				element.appendChild(fragment);
				if (ctrl.last_component) {
					ctrl.last_component.$element.after(_component.$element[0]);
				} else {
					ctrl.$comment.after(_component.$element[0]);
				}
				ctrl.last_component = _component;

				if (! state.parent || state.parent.is_rendered) {
					state.is_rendered = true;
					_component.trigger_render();
					$animator.enter(_component.$element);
				}
			});
		}).$catch(function (e) {
			console.error(e);
		});
};
