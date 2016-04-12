'use strict';

const InventoryDao       = require('../models/inventory.js');

const inventory = module.exports = {};

inventory.list =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '列表',
        },
    };
    const res = yield InventoryDao.list();
    yield this.render('views/inventory/list',{
        module: context.module,
        data:   res,
    });
};

inventory.add =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '入库',
        },
    };
    yield this.render('views/inventory/add',context);
};


inventory.processAdd = function*(){
    this.flash = yield InventoryDao.add(this.request.body);
    this.redirect('/inventory/add');
};
