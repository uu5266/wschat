// sign in:
const {re, se } = require('../components/register');

module.exports = {
    'GET /signin': async (ctx, next) => {
        let name = '甲'
        ctx.render('signin.html', {
            name: `路人${name}`
        });
    },

    'POST /signin': async (ctx, next) => {
        let name = ctx.request.body.name;
        let result = await se(name)
        let user = {
            id: result.id,
            name: result.name,
            image: result.id % 10
        }
        let value = Buffer.from(JSON.stringify(user)).toString('base64');
        console.log(`Set cookie value: ${value}`);
        ctx.cookies.set('name', value);
        ctx.response.redirect('/');
    },

    'GET /signout': async (ctx, next) => {
        ctx.cookies.set('name', '');
        ctx.response.redirect('/signin');
    },

    'POST /api/user': async (ctx, next) => {
        let name = ctx.request.body.name;
        let password = ctx.request.body.password;
        let result = await se(name)
        ctx.response.type = 'text/plain'
        if (result.id) {
            if ( result.password !== password) {
              ctx.response.body =  { id: 0 }
            } else {
              ctx.response.body =  { id: 1, result: result }
            }
        } else {
            ctx.response.body =  { id: 404 }
        }
    },

    'POST /api/re': async (ctx, next) => {
        let name = ctx.request.body.name;
        let password = ctx.request.body.password;
        let result = await se(name)
        ctx.response.type = 'text/plain'
        if (result.id) {
          ctx.response.body =  { id: 0 }
        } else {
            result = await re(name, password)
            ctx.response.body =  { id: 1 }
        }
    }
};
