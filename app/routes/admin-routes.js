
'use strict';

const router = require('koa-router')(); // router middleware for koa

const admin = require('../actions/admin.js');

router.get('/admin/list',                admin.list);
router.get('/admin/ajaxQuery',           admin.ajaxQuery);
router.get('/admin/userSuggest',         admin.userSuggest);

router.get('/admin/add',                 admin.add);
router.post('/admin/add',                admin.processAdd);
router.post('/admin/memberAudit',        admin.memberAudit);
router.post('/admin/ajaxDelete',         admin.processDelete);
router.get('/admin/edit/:id',            admin.edit);
router.post('/admin/edit/:id',           admin.processEdit);

router.get('/admin/inventory/add',       admin.inventoryAdd);
router.post('/admin/inventory/add',       admin.inventoryProcessAdd);


router.get('/admin/inventory/out',       admin.inventoryOut);
router.post('/admin/inventory/out',      admin.inventoryProcessAdd);







module.exports = router.middleware();
