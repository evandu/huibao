
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

router.get('/admin/inventory/add',              admin.inventoryAdd);
router.get('/admin/inventory/edit/:id',         admin.inventoryEdit);
router.post('/admin/inventory/edit/:id',         admin.inventoryProcessEdit);
router.get('/admin/inventory/list',             admin.inventoryList);
router.get('/admin/inventory/ajaxQuery',        admin.inventoryAjaxQuery);
router.post('/admin/inventory/add',             admin.inventoryProcessAdd);
router.get('/admin/inventory/out',              admin.inventoryOut);
router.post('/admin/inventory/out',             admin.processOut);
router.post('/admin/inventory/confirm',         admin.processConfirm);
router.post('/admin/inventory/ajaxDelete',      admin.inventoryProcessDelete);
router.get('/admin/inventory/log/ajaxQuery',    admin.inventoryLogAjaxQuery);
router.get('/admin/inventory/log/:id',          admin.inventoryLog);

router.get('/admin/user/log/ajaxQuery',         admin.userLogAjaxQuery);
router.get('/admin/user/log/:id',               admin.userLog);

module.exports = router.middleware();
