'use strict';

const Lib = require('../lib/lib');
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

Inventory.bookSuggest = function*(name) {
    const result = yield global.db.query("Select n.* From Inventory n Inner Join User u on n.UserId = u.UserId Where u.Role = 'admin' And n.Name like ? limit 0,10 ", [ '%' + name + '%']);
    return result[0].map(
        function (o) {
            return {InventoryId: o.InventoryId, Name: o.Name, Price: '单价' + o.Price + ' 元'};
        }
    );
};


Inventory.idIn = function*(ids,User) {
    const result = yield global.db.query(`Select * From Inventory Where UserId = ? And InventoryId in (${ids.join(',')})`, User.UserId);
    return result[0];
};

Inventory.logIdIn = function*(ids,User) {
    const result = yield global.db.query(`Select * From InventoryLog Where Active =0 And TargetId=? And LogId in (${ids.join(',')})`, User.UserId);
    return result[0];
};


Inventory.updateLogStatus = function*(id,User,Active) {
    yield global.db.query('Update InventoryLog Set Active = ?  Where Active =0 And LogId=? And TargetId=? ', [Active,id,User.UserId]);
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

Inventory.find = function*(Name,Price,User) {
    const result = yield global.db.query('Select * From Inventory Where Name =? And Price=? And UserId =? ', [Name,Price,User.UserId] );
    return result[0][0];
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


Inventory.log = function*(values) {
    const QuerySql = `Select a.*, b.Name UserName From InventoryLog a Left Join User b on a.TargetId = b.UserId $filter Order By a.CreateDate, a.LastUpdateDate`;
    const CountSql = `Select count(*) as count From InventoryLog a $filter`;
    const SumAmountSql = `Select sum(Price) as sumAmount From InventoryLog a $filter`;
    try {
        return yield Lib.paging(values, {}, [QuerySql, CountSql, SumAmountSql], function (data) {
            return _.map(data, d=> {
                d.CreateDate = Moment(d.CreateDate).format('YYYY-MM-DD HH:mm:ss')
                d.LastUpdateDate = Moment(d.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
                d.Price = d.Price + " 元"
                if( d.Active == 0){
                    d.Active='出库中'
                }else if(d.Active == 1){
                    d.Active='已出库'
                }else{
                    d.Active='出库失败'
                }
                return d;
            });
        });
    } catch (e) {
        Lib.logException('InventoryLog.log', e);
        return {
            op: {
                status: false,
                msg: '库存查询失败',
            },
        };
    }
};


Inventory.memberLog = function*(values) {

    const QuerySql = `Select a.*, b.Name MemberName From InventoryLog a Left Join Member b on a.TargetId = b.MemberId $filter Order By a.CreateDate, a.LastUpdateDate`;
    const CountSql = `Select count(*) as count From InventoryLog a $filter`;
    const SumAmountSql = `Select sum(Price) as sumAmount From InventoryLog a $filter`;

    try {
        return yield Lib.paging(values, {}, [QuerySql, CountSql, SumAmountSql], function (data) {
            return _.map(data, d=> {
                d.CreateDate = Moment(d.CreateDate).format('YYYY-MM-DD HH:mm:ss')
                d.LastUpdateDate = Moment(d.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
                d.Price = d.Price + " 元"

                if( d.Active == 0){
                    d.Active='出库中'
                }else if(d.Active == 1){
                    d.Active='已出库'
                }else{
                    d.Active='出库失败'
                }

                return d;
            });
        });
    } catch (e) {
        Lib.logException('InventoryLog.log', e);
        return {
            op: {
                status: false,
                msg: '库存查询失败',
            },
        };
    }
};

Inventory.updateNum = function*(id, Num, User) {
    yield global.db.query('Update Inventory Set Num = Num + ? Where InventoryId = ? And UserId = ?', [Num, id, User.UserId]);
}

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

