
'use strict';

const router = require('koa-router')(); // router middleware for koa

const member = require('../actions/member.js');

router.get('/',                           member.list);
router.get('/member/list',                member.list);          // render list members page
router.get('/member/add',                 member.add);           // render add a new member page
// router.get('/inventory/:id',           inventory.view);          // render view member details page
// router.get('/inventory/:id/edit',      inventory.edit);          // render edit member details page
// router.get('/inventory/:id/delete',    inventory.delete);        // render delete a member page
//
router.post('/member/add',                member.processAdd);    // process add member
// router.post('/inventory/:id/edit',     inventory.processEdit);   // process edit member
// router.post('/inventory/:id/delete',   inventory.processDelete); // process delete member
//

module.exports = router.middleware();
