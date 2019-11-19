/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ui_view_component.js
* Created at  : 2017-07-17
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

require("./ui_view_component_component");

var jqlite        = require("jeefo/jqlite"),
	reference     = {},
	constructor   = require("../constructor"),
	state_service = require("../services/state_service"),

event_handler = function (self, state, component) {
	self.state_id += 1;

	while (state.parent && ! state.parent.is_activated) {
		state = state.parent;
	}

	if (self.$is_activated) {
		if (self.$state && self.$state.parent === state) {
			self.destroy();
		} else if (state.parent && self.parent_state_name === state.parent.name) {
			self.destroy();
			constructor(self, component, state);
		}
	} else if (! state.is_activated) {
		constructor(self, component, state);
	}
};

module.exports = {
	selector   : "ui-view",
	controller : {
		on_init : function ($component) {
			// Variables
			var self      = this,
				$element  = $component.$element,
				name      = $element.get_attr("name") || '',
				i = 0, attrs = $component.element.attributes, attrs_template = '';

			// Current state's id
			self.state_id = 0;
			self.reference = reference;
			if (reference.name) {
				self.parent_state_name = reference.name;
			}

			// Comment
			self.$comment = jqlite(document.createComment(name ? ` uiView: ${ name } `: " uiView "));
			$element.before(self.$comment[0]);

			// Attributes
			attrs_template = '';
			for (; i < attrs.length; ++i) {
				if (attrs[i].name !== "jeefo-component-id") {
					attrs_template += ` ${ attrs[i].name }="${ attrs[i].value }"`;
				}
			}
			self.view_template = `uiViewComponent[${ attrs_template }]`;

			// Safely remove $element
			self.remove_element($element[0]);
			$component.$element = null;

			// Event handler
			self.event_handler = state_service.on("state_changed", function (event, state) {
				event_handler(self, state, $component);
			});

			if (state_service.current.name && ! state_service.current.is_activated && ! state_service.is_triggered) {
				event_handler(self, state_service.current, $component);
			}
		},
		on_render : function () {
			if (this.$state) {
				this.$state.is_rendered = true;
			}
		},
		destroy : function () {
			if (this.$state) {
				this.$state.destroy();
				this.$state = null;
			}
			if (this.last_component) {
				this.last_component.remove();
				this.last_component = null;
			}
			this.$is_activated = false;
		},
		on_destroy : function () {
			if (this.$state) {
				this.destroy();
			}

			state_service.off("state_changed", this.event_handler);
		},
		remove_element : function (element) {
			element.parentNode.removeChild(element);
		},
	},
	controller_as : "$view",
};
