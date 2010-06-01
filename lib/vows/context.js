
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
            if (e) { that.emitter.emit('error', e) }
            else   { that.emitter.emit.apply(that.emitter, ['success'].concat(args)) }
        };
    });
    this.name = (ctx.name ? ctx.name + ' ' : '') +
                (vow.description || '');
};

