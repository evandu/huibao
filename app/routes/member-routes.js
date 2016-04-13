
'use strict';

const router = require('koa-router')(); // router middleware for koa

const member = require('../actions/member.js');


router.get('/member/list',                member.list);
router.get('/member/add',                 member.add);
router.get('/member/:id',                 member.view);
// router.get('/inventory/:id/edit',      inventory.edit);
// router.get('/inventory/:id/delete',    inventory.delete);
//
router.post('/member/add',                member.processAdd);
// router.post('/inventory/:id/edit',     inventory.processEdit);
router.get('/member/:id/delete',          member.processDelete);
//

module.exports = router.middleware();
