'use strict';

const InventoryDao       = require('../models/inventory.js');

const inventory = module.exports = {};


inventory.suggest =function*(){
    this.body = yield InventoryDao.suggest(this.query.name);
};

inventory.edit =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '编辑',
        },
    };
    const res = yield InventoryDao.get(this.params.id);
    yield this.render('views/inventory/edit',{
        module: context.module,
        data:   res,
    });
};


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
        sum:    res.reduce(function(item, next){return item + next.Num * next.Price;
        },0 ),
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



inventory.out =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '出库',
        },
    };
    yield this.render('views/inventory/out',context);
};


inventory.processAdd = function*(){
    this.flash = yield InventoryDao.add(this.request.body);
    this.redirect('/inventory/add');
};

inventory.processDelete = function*(){
    this.flash = yield InventoryDao.delete(this.params.id);
    this.redirect('/inventory/list');
};

inventory.processEdit = function*(){
    this.flash =  yield InventoryDao.update(this.params.id, this.request.body);
    this.redirect('/inventory/list');
};

inventory.processOut =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '出库',
        },
    };
    console.log(this.request.body)
    yield this.render('views/inventory/out',context);
};
