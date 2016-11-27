
'use strict';

const router = require('koa-router')(); // router middleware for koa

const plan = require('../actions/plan.js');

router.get('/plan/list',           plan.list);
router.get('/plan/ajaxQuery',      plan.ajaxQuery);
router.get('/plan/add',            plan.add);
router.post('/plan/add',           plan.processAdd);
router.post('/plan/ajaxDelete',    plan.processDelete);
router.post('/plan/in',            plan.in);
router.post('/plan/!in',           plan.notIn);

module.exports = router.middleware();
