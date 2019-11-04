/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : resolve.js
* Created at  : 2017-08-30
* Updated at  : 2017-08-31
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var $q     = require("jeefo/q"),
	assign = require("jeefo/utils/object/assign"),
	get_resolvers, resolve_dependencies;

get_resolvers = function (state, dependencies) {
	var i = dependencies.length, resolvers = new Array(i);

	while (i--) {
		if (state.values[dependencies[i]]) {
			resolvers[i] = state.values[dependencies[i]];
		} else {
			resolvers[i] = resolve_dependencies(state, state.resolve[dependencies[i]]);
		}
	}

	return resolvers;
};

resolve_dependencies = function (state, dependency) {
	if (typeof dependency === "function") {
		return $q.when(dependency());
	}

	return $q.all(get_resolvers(state, dependency.dependencies)).then(function (args) {
		return dependency.fn.apply(null, args);
	});
};

module.exports = function resolve (self, component, state) {
	if (! state.resolve) { return $q.when([]); }

	state.values = assign({}, state.data);

	var id        = self.state_id,
		resolvers = get_resolvers(state, state.controller.dependencies);

	return $q.all(resolvers).then(function (args) {
		if (self.state_id !== id) {
			throw "deactivated";
		}
		return args;
	});
};
