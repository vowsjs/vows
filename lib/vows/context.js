
this.Context = function (vow, ctx, env) {
    var that = this;

    this.tests = vow.callback;
    this.topics = (ctx.topics || []).slice(0);
    this.emitter = null;
    this.env = env || {};
    this.env.context = this;
    this.env.callback = function (e, res) {
        var args = Array.prototype.slice.call(arguments, 1);
        var emit = function () {
            // Convert callback-style results into events.
            //
            // We handle a special case, where the first argument is a
            // boolean, in which case we treat it as a result, and not
            // an error. This is useful for `path.exists` and other
            // functions like it, which only pass a single boolean
            // parameter instead of the more common (error, result) pair.
            if (typeof(e) === 'boolean' && args.length === 0) {
                that.emitter.emit('success', e);
            } else {
                if (e) { that.emitter.emit('error', e) }
                else   { that.emitter.emit.apply(that.emitter, ['success'].concat(args)) }
            }
        };
        // If `this.callback` is called synchronously,
        // the emitter will not have been set yet,
        // so we defer the emition, that way it'll behave
        // asynchronously.
        if (that.emitter) { emit() }
        else              { process.nextTick(emit) }
    };
    this.name = vow.description;
    this.title = [
        ctx.title || '',
        vow.description || ''
    ].join(/^[#.:]/.test(vow.description) ? '' : ' ').trim();
};

