/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Login handlers (invoked by router to render templates)                                         */
/*                                                                                                */
/* All functions here either render or redirect, or throw.                                        */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const passport = require('koa-passport'); // authentication
const bcrypt = require('co-bcrypt');    // bcrypt library
const UserDao = require('../models/user.js');

const handler = module.exports = {};
/**
 * GET /login - render login page
 *
 * Allow url after the 'login', to specify a redirect after a successful login
 */
handler.getLogin = function*() {
    const context = this.flash.formdata || {}; // failed login? fill in previous values

    yield this.render('views/login', context);
};


/**
 * GET /logout - logout user
 */
handler.getLogout = function*() {
    this.logout();
    this.session = null;
    this.redirect('/login');
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * POST /login - process login
 */
handler.postLogin = function* postLogin(next) {
    try {
        // qv github.com/rkusa/koa-passport/blob/master/test/authenticate.js
        // for remember-me function, qv examples in github.com/jaredhanson/passport-local

        const ctx = this; // capture 'this' to pass into callback

        yield* passport.authenticate('local', function*(err, user) {
            if (err) this.throw(err.status||500, err.message);
            if (user) {
                // passport successfully authenticated user: log them in
                yield ctx.login(user);

                // if 'remember-me', set cookie for 1 month, otherwise set session only
                ctx.session.maxAge = ctx.request.body['remember-me'] ? 1000*60*60*24*30 : 0;

                // if we were provided with a redirect URL after the /login, redirect there, otherwise /
                let url = ctx.captures[0] ? ctx.captures[0] : '/';
                if (ctx.request.search) url += ctx.request.search;
                ctx.redirect(url);
            } else {
                // login failed: redisplay login page with login fail message
                const loginfailmsg = '用户名或密码不正确';
                ctx.flash = { formdata: ctx.request.body, loginfailmsg: loginfailmsg };
                ctx.redirect(ctx.url);
            }
        }).call(this, next);

    } catch (e) {
        this.throw(e.status||500, e.message);
    }
};


handler.modify = function*() {
    const context = {
        module: {
            name: '帐户管理',
            subName: '修改密码',
        }
    };
    const res = yield UserDao.get(this.passport.user.UserId);
    yield this.render('views/modify', {
        module: context.module,
        data: res,
    });
};

handler.processModify = function*() {
    const values = {}
    if (this.request.body.Password && this.request.body.Password != '') {
        const salt = yield bcrypt.genSalt(10)
        values['Password'] = yield bcrypt.hash(this.request.body.Password, salt);
    }

    values['Address'] = this.request.body['Address'];
    values['Mobile'] =  this.request.body['Mobile'];

    this.flash = yield UserDao.update(this.passport.user.UserId, values);
    this.flash = {op: {status: true, msg: '账户编辑成功'}};
    this.redirect('/modify');
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
