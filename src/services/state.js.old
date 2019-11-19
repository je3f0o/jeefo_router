/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : state.js
* Created at  : 2017-09-21
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

var object_keys  = Object.keys,
	array_remove = require("jeefo_utils/array/remove"),

State = function (definition) {
	this.name       = definition.name;
	this.children   = [];
	this.definition = definition;
};

State.prototype = {
	is_changed : function (name, old_params) {
		if (this.name !== name) {
			return true;
		}

		var keys = object_keys(old_params);
		if (keys.length !== object_keys(this.params).length) {
			return true;
		}

		var i = keys.length, params = this.params;
		while (i--) {
			if (old_params[keys[i]] !== params[keys[i]]) {
				return true;
			}
		}
	},
	destroy : function () {
		var i = this.children.length;
		while (i--) {
			this.children[i].destroy();
		}
		if (this.parent) {
			array_remove(this.parent.children, this);
		}
		this.values = null;
		this.is_activated = this.is_rendered = false;
	}
};

module.exports = State;
