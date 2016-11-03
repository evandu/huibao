
'use strict';

const router = require('koa-router')(); // router middleware for koa
const bodyParse =require('koa-body');

const member = require('../actions/member.js');


router.get('/member/list',                member.list);
router.get('/member/ajaxQuery',           member.ajaxQuery);
router.get('/member/amountLogQuery',      member.amountLogQuery);
router.get('/member/add',                 member.add);
router.post('/member/addAmount',          member.processAddAmount);
// router.get('/member/:id',              member.view);
router.get('/member/:id/edit',            member.edit);
router.get('/member/:id/detail',            member.detail);

router.post('/member/add',       bodyParse({multipart:true}), member.processAdd);
router.post('/member/:id/edit',   bodyParse({multipart:true}), member.processEdit);
router.post('/member/ajaxDelete',          member.processDelete);
router.get('/member/suggest',             member.suggest);
//

module.exports = router.middleware();
