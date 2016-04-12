'use strict';

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
            subName: '列表',
        },
    };
    yield this.render('views/inventory/add',context);
};
