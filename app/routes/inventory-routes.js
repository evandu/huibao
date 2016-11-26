/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Members routes                                                                                */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa

const inventory = require('../actions/inventory.js');

router.get('/',                        inventory.list);
router.get('/inventory/list',          inventory.list);
router.get('/ajaxQuery',               inventory.ajaxQuery);
router.get('/inventory/ajaxQuery',     inventory.ajaxQuery);
router.get('/inventory/suggest',       inventory.suggest);
router.get('/inventory/out',           inventory.out);
router.post('/inventory/confirm',      inventory.processConfirm);
router.post('/inventory/out',          inventory.processOut);

router.get('/inventory/inAjaxQuery',   inventory.inAjaxQuery);
router.get('/inventory/in',            inventory.in);
router.post('/inventory/in',           inventory.processIn);
router.post('/inventory/!in',           inventory.processNotIn);

router.get('/member/log/ajaxQuery',   inventory.memberLogAjaxQuery);
router.get('/member/log/:id',         inventory.memberLog);

router.get('/inventory/log/ajaxQuery',   inventory.inventoryLogAjaxQuery);
router.get('/inventory/log/:id',         inventory.inventoryLog);

//router.get('/inventory/add',          inventory.add);
// router.get('/inventory/:id',        inventory.view);
//router.get('/inventory/:id/edit',      inventory.edit);
// router.get('/inventory/:id/delete', inventory.delete);
//router.post('/inventory/add',          inventory.processAdd);
//router.post('/inventory/:id/edit',     inventory.processEdit);
//router.post('/inventory/ajaxDelete',    inventory.processDelete);


module.exports = router.middleware();

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
