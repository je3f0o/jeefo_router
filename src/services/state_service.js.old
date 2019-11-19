/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : state_service.js
* Created at  : 2017-07-01
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

var	State        = require("./state"),
	slice        = Array.prototype.slice,
	UrlPattern   = require("jeefo_url_matcher"),
	array_remove = require("jeefo_utils/array/remove"),

// Stores
LIST                = [],
EVENTS              = {},
STATES              = {},
PENDING_DEFINITIONS = {},

// private methods
get_parent_name = function (name) {
	var index = name.lastIndexOf('.');
	if (index !== -1) {
		return name.substring(0, index);
	}
},

find = function (url) {
	var result;

	LIST.some(function (state) {
		var params = state.pattern.match(url);

		if (params) {
			result       = state;
			state.params = params;
			return true;
		}
	});

	if (result) {
		var state        = result,
			parent_index = state.name.lastIndexOf('.'), parent_name;

		while (parent_index !== -1) {
			parent_name  = state.name.substring(0, parent_index);
			state.parent = STATES[parent_name];
			state        = state.parent;

			parent_index = state.name.lastIndexOf('.');
		}

		return result;
	}
},

// State Service
StateService = function () {
	this.current = { params : {} };
};

StateService.prototype = {
	register : function (definition) {
		var parent_name  = get_parent_name(definition.name),
			parent_state = STATES[parent_name];

		if (parent_name && ! parent_state) {
			if (PENDING_DEFINITIONS[parent_name]) {
				PENDING_DEFINITIONS[parent_name].push(definition);
			} else {
				PENDING_DEFINITIONS[parent_name] = [definition];
			}

			return;
		}

		var state = new State(definition);

		if (parent_state) {
			state.pattern = new UrlPattern(definition.url, parent_state.pattern);
		} else {
			state.pattern = new UrlPattern(definition.url);
		}

		LIST.push(state);
		STATES[definition.name] = state;

		if (PENDING_DEFINITIONS[definition.name]) {
			var _penders = PENDING_DEFINITIONS[definition.name], i = _penders.length;

			while (i--) {
				this.register(_penders[i]);
			}

			PENDING_DEFINITIONS[definition.name] = null;
		}

		return this;
	},
	//transition_to : function (name, params) { },
	go : function (url) {
		var current = this.current, params = current.params;

		var state = find(url);

		if (state.is_changed(current.name, params)) {
			this.current = state;
			this.trigger_event("state_changed", state);
			this.trigger_event("state_changed_success", url);
		}
	},
	on : function (event_name, event_handler) {
		if (! EVENTS[event_name]) {
			EVENTS[event_name] = [];
		}
		EVENTS[event_name].push(event_handler);

		return event_handler;
	},
	off : function (event_name, event_handler) {
		if (EVENTS[event_name]) {
			array_remove(EVENTS[event_name], event_handler);
		}
	},
	trigger_event : function (event_name) {
		this.is_triggered = true;

		var events = EVENTS[event_name];
		if (! events) { return; }

		var args  = slice.call(arguments, 1),
			event = {
				preventDefault : function () {
					this.defaultPrevented = true;
				}
			};

		args.unshift(event);

		for (var i = 0; i < events.length; ++i) {
			events[i].apply(null, args);
			if (event.defaultPrevented) {
				break;
			}
		}

		this.is_triggered = false;
	},
	initialize : function () {
		var self = this, to_replace = true;

		//history.replaceState(null, null, location.pathname);
		self.on("state_changed_success", function (event, url) {
			if (to_replace) {
				history.replaceState(null, null, url);
				to_replace = false;
			} else {
				history.pushState(null, null, url);
			}
		});

		window.addEventListener("popstate", function (event) {
			event.preventDefault();
			event.stopPropagation();

			to_replace = true;
			self.go(location.pathname);

			return false;
		}, false);

		self.go(location.pathname);
	},
};

module.exports = StateService;
