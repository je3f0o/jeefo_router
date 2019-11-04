/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : router_link_directive.js
* Created at  : 2017-07-19
* Updated at  : 2017-09-27
* Author      : jeefo
* Purpose     :
* Description : 
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var state_service = require("../services/state_service");

module.exports = {
	selector   : "router-link",
	bindings   : {
		router_link : "@routerLink"
	},
	controller : function ($element) {
		if ($element[0].tagName === "A") {
			$element.set_attr("href", this.router_link);
		}

		$element.on("click", function (event) {
			event.preventDefault();
			event.stopPropagation();

			state_service.go($element.get_attr("href"));
		});
	},
	controller_as : "$link",
};
