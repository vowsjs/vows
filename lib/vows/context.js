
this.Context = function (vow, ctx, env) {
    var that = this;

    this.tests = vow.callback;
    this.topics = (ctx.topics || []).slice(0);
    this.emitter = null;
    this.env = env || {};
    this.env.context = this;
    this.env.__defineGetter__('callback', function () {
        that._callback = true;

        return function (e, res) {
            var args = Array.prototype.slice.call(arguments, 1);
            var emit = function () {
                if (e) { that.emitter.emit('error', e) }
                else   { that.emitter.emit.apply(that.emitter, ['success'].concat(args)) }
            };
            // If `this.callback` is called synchronously,
            // the emitter will not have been set yet,
            // so we defer the emition, that way it'll behave
            // asynchronously.
            if (that.emitter) { emit() }
            else              { process.nextTick(emit) }
        };
    });
    this.name = (ctx.name ? ctx.name + ' ' : '') +
                (vow.description || '');
};

