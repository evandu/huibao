'use strict';

const Lib        = require('../lib/lib.js');

const Inventory = module.exports = {};

Inventory.add = function*(values){
    try {
        yield GLOBAL.db.query('Insert Into Inventory Set ?', values);
        return {
            op: {
                status: true,
                msg:    values.Name + '入库成功',
            },
        };
    } catch (e) {
        switch (e.code) {
            case 'ER_BAD_NULL_ERROR':
            case 'ER_NO_REFERENCED_ROW_2':
            case 'ER_NO_DEFAULT_FOR_FIELD':
                return {
                    op: {
                        status: false,
                        msg:    '请检查输入',
                    },
                };
            case 'ER_DUP_ENTRY':
                return {
                    op: {
                        status: false,
                        msg:    '物品名称重复,请重新填写',
                    },
                };
            default:
                Lib.logException('Inventory.insert', e);
                return {
                    op: {
                        status: false,
                        msg:    '入库失败',
                    },
                };
        }
    }
};
