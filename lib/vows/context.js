
var Context = this.Context = function (vow, ctx, env) {
    var that = this;

    // so we can get to adjacent contexts
    ctx.children = ctx.children || [];
    ctx.children.push(this);
    this.parent = ctx;

    this.tests = vow.callback;
    this.topics = (ctx.topics || []).slice(0);
    this.emitter = null;
    this.env = env || {};
    this.env.context = this;
    this._vows = {};

    this.env.callback = function (/* arguments */) {
        var ctx = this;
        var args = Array.prototype.slice.call(arguments);

        var emit = (function (args) {
            //
            // Convert callback-style results into events.
            //
            var event = 'success';
            // If the first argument is not an instance of Error,
            // we will treat this as a success instead of as an error
            if (vow.batch.suite.options.error) {
                if (args.length > 0) {
                    if (args[0] instanceof Error) {
                        event = 'error';
                    }
                    else if (args[0] === null) {
                        args.shift();
                    }
                }
            }
            return function () {
                that.emitter.ctx = ctx;
                that.emitter.emit.apply(that.emitter, [event].concat(args));
            };
        })(args.slice(0));
        // If `this.callback` is called synchronously,
        // the emitter will not have been set yet,
        // so we defer the emition, that way it'll behave
        // asynchronously.
        if (that.emitter) { emit() }
        else              { process.nextTick(emit) }
    };
    this.name = vow.description;
    // events is an alias for on
    if (this.name === 'events') {
      this.name = vow.description = 'on';
    }

    // if this is a sub-event context AND it's context was an event,
    // then I must enforce event order.
    // this will not do a good job of handling pin-pong events
    if (this.name === 'on' && ctx.isEvent) {
        this.after = ctx.name;
    }

    if (ctx.name === 'on') {
        this.isEvent = true;
        this.after = ctx.after;
        this.event = this.name;

        // If we are part of "synchronous vows" that are evented
        // then only one key is valid here
        if (Array.isArray(this.parent.tests)) {
            var events = Object.keys(this.tests);
            if (events.length > 1) {
                throw new Error('Can only test one event at a time in a series.');
            }

            this.event = events[0];
        }
    } else {
        this.isEvent = false;
        this.event = 'success';
    }

    this.title = [
        ctx.title || '',
        vow.description || ''
    ].join(/^[#.:]/.test(vow.description) ? '' : ' ').trim();
};

require('util').inherits(Context, require('events').EventEmitter);

// computes the topics that need to be passed as arguments to a given topic
Context.prototype.nextTopics = function() {
    if (typeof this.tests.next === 'function') {
        var me = this.parent ? this.parent.children.indexOf(this) : false;
        if (me && this.parent &&
            Array.isArray(this.parent.tests)) {
            return this.parent.children[me - 1].topics.slice();
        } else {
            throw new Error('Use of next only allowed in syncronus context');
        }
    } else {
        return this.topics;
    }
}

Context.prototype.addVow = function(vow) {
     this._vows[vow.uuid] = vow;
};

Context.prototype.tryEnd = function(vow) {
    if (vow) {
      delete this._vows[vow.uuid];
    }
    if (!Object.keys(this._vows).length &&
        (this.children &&
        this.children.every(function(c){return c.complete})) ||
        !this.children) {

        this.complete = true;
        this.emit('complete');
        if (this.parent instanceof Context) {
          this.parent.tryEnd();
        }
    }

};

