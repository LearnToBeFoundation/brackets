/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */

define(function (require, exports, module) {
    "use strict";

    var Pusher = require('thirdparty/pusher.min');

    function PusherPubSub(channel, key){
        this.defaultChannel = "private-" + (channel || 'ltb_collab');
        this._pusher = new Pusher(key || '9b7db77e3f5402f223d5', { encrypted: true });
        this._channels = {};
    }q

    PusherPubSub.prototype.sub = function(eventName, callback){
        withClientPrefixed(eventName, function(ev){
            this.getDefaultChannel().bind(ev, callback);
        });
    };

    PusherPubSub.prototype.pub = function(eventName, params){
        // must be client prefixed, since the event is triggered from a client
        this.getDefaultChannel().trigger(clientPrefix(ev), params);
    };

    PusherPubSub.prototype.unsub = function(eventName, callback){
        withClientPrefixed(eventName, function(ev){
            this.getDefaultChannel().unbind(ev, callback);
        });
    };

    PusherPubSub.prototype.getDefaultChannel = function(){
        return this.getSubscribedChannel(this.defaultChannel);
    };

    PusherPubSub.prototype.getSubscribedChannel = function(channelName){
        this._channels[channelName] = this._channels[channelName] || this._pusher.subscribe(channelName);

        return this._channels[channelName];
    };

    function clientPrefix(eventName){
        return "client-" + eventName;
    }

    // wrapping events in this function also listens for events with the same
    // name originating from another client
    function withClientPrefixed(eventName, func){
        for (var ev in [eventName, clientPrefix(eventName)]){
            func.apply(this, [ev]);
        }
    }

    // Export public API
    module.exports = PusherPubSub;
});
