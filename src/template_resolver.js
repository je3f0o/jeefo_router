/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : template_resolver.js
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

var state_service     = require("./services/state_service"),
	template_resolver = require("jeefo/component/template_resolver");

module.exports = function resolve_template (state) {
	if (state.template) {
		return template_resolver.resolve_template(state.template);
	} else if (state.template_url) {
		return template_resolver.resolve_template_url(state.template_url, [
			state_service.current.params
		]);
	}

	throw new Error("State template not found!");
};
