'use strict';

const Lib        = require('../lib/lib.js');

const Member = module.exports = {};

Member.list = function*(){
    const sql = 'Select * From Member Order By CreateDate, LastUpdateDate';
    try{
        const result = yield GLOBAL.db.query(sql,1);
        return result[0];
    }catch(e){
        Lib.logException('Member.List', e);
        return {
            op: {
                status: false,
                msg:    '查询失败',
            },
        };
    }
};

Member.add = function*(values){
    try {
        const result = yield GLOBAL.db.query('Insert Into Member Set ?', values);
        return {
            op: {
                status: true,
                msg:    values.Name + '添加客户成功, id=' + result[0].insertId,
            },
        };
    } catch (e) {
        Lib.logException('Member.insert', e);
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
                        msg:    '代码重复,请重新填写',
                    },
                };
            default:
                return {
                    op: {
                        status: false,
                        msg:    '添加客户',
                    },
                };
        }
    }
};