/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Members routes                                                                                */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa

const inventory = require('../actions/inventory.js');

router.get('/',                        inventory.list);
router.get('/inventory/list',          inventory.list);          // render list members page
router.get('/inventory/add',           inventory.add);           // render add a new member page
// router.get('/inventory/:id',        inventory.view);          // render view member details page
router.get('/inventory/:id/edit',      inventory.edit);          // render edit member details page
// router.get('/inventory/:id/delete', inventory.delete);        // render delete a member page
//
router.post('/inventory/add',          inventory.processAdd);    // process add member
router.post('/inventory/:id/edit',     inventory.processEdit);   // process edit member
router.get('/inventory/:id/delete',    inventory.processDelete); // process delete member
//

router.get('/inventory/out',           inventory.out);
router.post('/inventory/confirm',      inventory.processConfirm);
router.post('/inventory/out',          inventory.processOut);
router.get('/inventory/suggest',       inventory.suggest);
module.exports = router.middleware();

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
