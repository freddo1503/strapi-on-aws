import { Context } from 'koa';

export default {
    async index(ctx: Context) {
        ctx.status = 200;
        ctx.body = {
            status: 'ok',
        };
    },
};
