/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : main.js
* Created at  : 2019-11-05
* Updated at  : 2019-11-06
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

const EventEmiiter  = require("@jeefo/utils/event_emitter");
const extend_member = require("@jeefo/utils/class/extend_member");

global.location = {
    host     : "localhost:3000",
    hostname : "localhost",
    protocol : "http",

    get origin () {
        const { protocol, host } = this;
        return `${ protocol }://${ host }`;
    }
};

global.Event = class Event {
    constructor (type) {
        this.type = type;
    }
};

extend_member(EventEmiiter, "trigger", function (event) {
    if (typeof event === "string") {
        event = new Event(event);
    }
    this.emit(event.type, event);
});

const router = require("../index.js");

const states = [
    {
        name       : "main",
        Controller : require("./main_state")
    },
    {
        name       : "main.user.profile",
        Controller : class UserProfile {
            static get url () { return "/:id"; }
        }
    },
    {
        name       : "main.user",
        Controller : class User {
            static get url () { return "user"; }
        }
    },
];

states.forEach(state => router.register(state.name, state.Controller));

// Something like that...
//
router.on("state_changed", event => {
    switch (router.state) {
        case "failed" :
            break;
        case "success" :
            break;
    }
    console.log(event);
    console.log("Current state:", router.current_state);
});

console.log(router.states[1].url_pattern);

router.go("/user/23?q=123&something=233#hash");
//router.go("/watch?session=123");
