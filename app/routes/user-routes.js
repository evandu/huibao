
'use strict';

const router = require('koa-router')(); // router middleware for koa

const user = require('../actions/user.js');

//router.get('/user/list',                user.list);
//router.get('/user/:id/delete',          user.processDelete);

//router.get('/user/add',                 user.add);
//router.post('/user/add',                user.processAdd);
router.get('/user/modify',                user.edit);
router.post('/user/modify',               user.processEdit);

//router.get('/user/:id/edit',             user.edit);
//router.post('/user/:id/edit',           user.processEdit);

//

module.exports = router.middleware();
