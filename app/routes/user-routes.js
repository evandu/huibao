
'use strict';

const router = require('koa-router')(); // router middleware for koa

const user = require('../actions/login.js');

router.get('/modify',      user.modify);
router.post('/modify',     user.processModify);

//

module.exports = router.middleware();
