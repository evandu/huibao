'use strict';

const Lib        = require('../lib/lib.js');

const Inventory = module.exports = {};

Inventory.suggest = function*(name) {
    const result = yield global.db.query('Select * From Inventory Where Num >0 and  Name like ? limit 0,10 ', '%' + name + '%');
    return  result[0].map(
      function(o){
          return { InventoryId: o.InventoryId, Name: o.Name , Price: o.Num + ' 件 * '+ o.Price +' 元' };
      }
    );
};


Inventory.idIn = function*(ids) {
    const result = yield global.db.query('Select * From Inventory Where InventoryId in (' + ids.join(',') +')');
    return  result[0];
};

Inventory.get = function*(id) {
    const result = yield global.db.query('Select * From Inventory Where InventoryId = ?', id);
    const member = result[0];
    return member[0];
};


Inventory.delete = function*(id){
    try{
        yield global.db.query('Delete From Inventory Where InventoryId = ?', id);
        return {
            op: {
                status: true,
                msg:    'id=' + id + ', 删除成功',
            },
        };
    }catch(e) {
        Lib.logException('Inventory.delete', e);
        return {
            op: {
                status: false,
                msg:    '删除失败',
            },
        };
    }
};

Inventory.list = function*(){
    const sql = 'Select * From Inventory Order By CreateDate, LastUpdateDate';
    try{
        const result = yield global.db.query(sql,1);
        return result[0];
    }catch(e){
        Lib.logException('Inventory.list', e);
        return {
            op: {
                status: false,
                msg:    '查询失败',
            },
        };
    }
};


Inventory.log = function*(InventoryId, MemberId){
    let sql = 'Select a.*, m.Code as Code, m.Name as MemberName From InventoryLog as a Left Join Member as m On m.MemberId = a.MemberId where a.InventoryId = ? Order By a.CreateDate';
    if(MemberId){
        sql = 'Select a.*, m.Code as Code, m.Name as MemberName From  InventoryLog as a  Left Join  Member as m  On m.MemberId = a.MemberId where m.MemberId = ? Order By a.CreateDate';
    }
    try{
        const result = yield global.db.query(sql,InventoryId?InventoryId:MemberId);
        return result[0];
    }catch(e){
        Lib.logException('Inventory.log', e);
        return {
            op: {
                status: false,
                msg:    '查询失败',
            },
        };
    }
};


Inventory.update = function*(id,values) {
    try {
        const result = yield global.db.query('Update Inventory Set ? Where InventoryId = ?', [values, id]);
        return {
            op: {
                status: true,
                msg:    values.Name + '入库成功, id=' + result[0].insertId,
            },
        };
    } catch (e) {
        Lib.logException('Inventory.insert', e);
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
                return {
                    op: {
                        status: false,
                        msg:    '入库失败',
                    },
                };
        }
    }
};


Inventory.addlog = function *(values) {
    yield global.db.query('Insert Into InventoryLog Set ?', values);
};

Inventory.add = function*(values){
    try {
        const result = yield global.db.query('Insert Into Inventory Set ?', values);
        return {
            op: {
                status: true,
                msg:    values.Name + '编辑成功, id=' + result[0].insertId,
            },
        };
    } catch (e) {
        Lib.logException('Inventory.insert', e);
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
                return {
                    op: {
                        status: false,
                        msg:    '编辑失败',
                    },
                };
        }
    }
};
