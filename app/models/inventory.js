'use strict';

const Lib = require('../lib/lib.js');
const Moment = require('moment');
const _ = require('lodash');
const Inventory = module.exports = {};

Inventory.suggest = function*(name,User) {
    const result = yield global.db.query('Select * From Inventory Where UserId = ? And Name like ? limit 0,10 ', [User.UserId, '%' + name + '%']);
    return result[0].map(
        function (o) {
            return {InventoryId: o.InventoryId, Name: o.Name, Price: o.Num + ' 件 * ' + o.Price + ' 元'};
        }
    );
};

Inventory.idIn = function*(ids,User) {
    const result = yield global.db.query(`Select * From Inventory Where UserId = ? And InventoryId in (${ids.join(',')})`, User.UserId);
    return result[0];
};

Inventory.idIn = function*(ids,User) {
    const result = yield global.db.query(`Select * From Inventory Where UserId = ? And InventoryId in (${ids.join(',')})`, User.UserId);
    return result[0];
};

Inventory.get = function*(id,User) {
    let result
    if(User.Role == 'admin'){
        result = yield global.db.query('Select * From Inventory Where InventoryId = ?', id);
    }else{
        result = yield global.db.query('Select * From Inventory Where InventoryId = ? and UserId = ?', [id,User.UserId]);
    }
    const member = result[0];
    return member[0];
};


Inventory.delete = function*(ids,User) {
    try {
        if(User.Role == 'admin'){
            yield global.db.query(`Delete From Inventory Where InventoryId in (${ids.join(',')})`);
        }else{
            yield global.db.query(`Delete From Inventory Where UserId = ? and InventoryId in (${ids.join(',')})`, User.UserId);
        }
        return {
            op: {
                status: true,
                msg: 'id=' + ids + ', 删除成功',
            },
        };
    } catch (e) {
        Lib.logException('Inventory.delete', e);
        return {
            op: {
                status: false,
                msg: '删除失败',
            },
        };
    }
};

Inventory.list = function*(values, likeValues) {
    const QuerySql = 'Select * From Inventory $filter Order By CreateDate, LastUpdateDate';
    const CountSql = 'Select count(*) as count From Inventory $filter ';
    const SumAmountSql = 'Select sum(Price) as sumAmount From Inventory $filter ';
    try {
        return yield Lib.paging(values, likeValues, [QuerySql, CountSql, SumAmountSql], function (data) {
            return _.map(data, d=> {
                d.CreateDate = Moment(d.CreateDate).format('YYYY-MM-DD HH:mm:ss')
                d.LastUpdateDate = Moment(d.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
                d.SumPrice = d.Price * d.Num +" 元"
                d.Price = d.Price + " 元"
                return d;
            });
        });
    } catch (e) {
        Lib.logException('Inventory.List', e);
        return {
            op: {
                status: false,
                msg: '库存查询失败',
            },
        };
    }
};


Inventory.log = function*(InventoryId, MemberId) {
    let sql = 'Select a.*, m.Code as Code, m.Name as MemberName From InventoryLog as a Left Join Member as m On m.MemberId = a.MemberId where a.InventoryId = ? Order By a.CreateDate';
    if (MemberId) {
        sql = 'Select a.*, m.Code as Code, m.Name as MemberName From  InventoryLog as a  Left Join  Member as m  On m.MemberId = a.MemberId where m.MemberId = ? Order By a.CreateDate';
    }
    try {
        const result = yield global.db.query(sql, InventoryId ? InventoryId : MemberId);
        return result[0];
    } catch (e) {
        Lib.logException('Inventory.log', e);
        return {
            op: {
                status: false,
                msg: '查询失败',
            },
        };
    }
};


Inventory.update = function*(id, values, User) {
    try {
        let result;
        if(User.Role == 'admin'){
           result = yield global.db.query('Update Inventory Set ? Where InventoryId = ?', [values, id]);
        }else{
            result = yield global.db.query('Update Inventory Set ? Where UserId = ? and  InventoryId = ?', [values,User.UserId, id]);
        }
        return {
            op: {
                status: true,
                msg: values.Name + '入库成功, id=' + result[0].insertId,
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
                        msg: '请检查输入',
                    },
                };
            case 'ER_DUP_ENTRY':
                return {
                    op: {
                        status: false,
                        msg: '物品名称重复,请重新填写',
                    },
                };
            default:
                return {
                    op: {
                        status: false,
                        msg: '入库失败',
                    },
                };
        }
    }
};

Inventory.out = function*(values, User) {
    const data =  _.map(_.keys(values),  o=> {
        return "WHEN " + o + " THEN Num - " + Math.abs(values[o])
    })
  yield global.db.query(`Update Inventory Set Num  = Case InventoryId  \n ${data.join("\n")}  \n End Where UserId = ? and InventoryId in( ${_.keys(values).join(",")} )`, User.UserId);
};

Inventory.in = function*(values, User) {
    const data =  _.map(_.keys(values),  o=> {
        "WHEN " + o + "THEN Num + " + Math.abs(values[o])
    })
    yield global.db.query(`Update Inventory Set Num  =  Case InventoryId \n ${data.join("\n")} \n End  Where UserId = ? and InventoryId in(${_.keys(values).join(",")})`, User.UserId);
};



Inventory.addLog = function *(values) {
    yield global.db.query('Insert Into InventoryLog Set ?', values);
};

Inventory.add = function*(values) {
    try {
        const result = yield global.db.query('Insert Into Inventory Set ?', values);
        return {
            op: {
                status: true,
                msg: values.Name + '编辑成功, id=' + result[0].insertId,
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
                        msg: '请检查输入',
                    },
                };
            case 'ER_DUP_ENTRY':
                return {
                    op: {
                        status: false,
                        msg: '物品名称重复,请重新填写',
                    },
                };
            default:
                return {
                    op: {
                        status: false,
                        msg: '编辑失败',
                    },
                };
        }
    }
};
