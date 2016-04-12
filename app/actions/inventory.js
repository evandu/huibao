'use strict';

const Inventory       = require('../models/inventory.js');

const inventory = module.exports = {};

inventory.list =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '列表',
        },
    };
    yield this.render('views/inventory/list',context);
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
    const context = {
        module: {
            name:    '库存',
            subName: '入库',
        },
    };
    this.flash = yield Inventory.add(this.request.body);
    yield this.render('views/inventory/add',context);
};
