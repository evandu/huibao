'use strict';

const Lib = require('../lib/lib');
const _ = require('lodash');
const Moment = require('moment');

const Book = module.exports = {};


Book.list = function*(values, likeValues) {
    const QuerySql = 'Select b.*, n.Name as InventoryName, m.Name as MemberName,m.Code as Code From Book b Inner join Inventory n Inner join Member m on m.MemberId= b.MemberId and n.InventoryId = b.InventoryId $filter Order By b.CreateDate, b.LastUpdateDate';
    const CountSql = 'Select count(*) as count From Book b Inner join Inventory n Inner join Member m on m.MemberId= b.MemberId and n.InventoryId = b.InventoryId $filter ';
    try {
        return yield Lib.paging(values, likeValues, [QuerySql, CountSql], function (data) {
            return _.map(data, d=> {
                d.CreateDate = Moment(d.CreateDate).format('YYYY-MM-DD HH:mm:ss')
                if( d.Active == 0){
                    d.Active='未采购'
                }else if(d.Active == 1){
                    d.Active='已采购'
                }else{
                    d.Active='采购未通过'
                }
                d.LastUpdateDate = Moment(d.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
                return d;
            });
        });
    } catch (e) {
        Lib.logException('Book.List', e);
        return {
            op: {
                status: false,
                msg: '数据查询失败',
            },
        };
    }
};


Book.delete = function*(ids, User) {
    try {
        if (User.Role == 'admin') {
            yield global.db.query(`Delete From Book Where BookId in (${ids.join(",")})`);
        } else {
            yield global.db.query(`Delete From Book Where UserId = ? And BookId in (${ids.join(",")})`, User.UserId);
        }
        return {
            op: {
                status: true,
                msg: 'ids=' + ids.join(",") + ', 删除成功',
            },
        };
    } catch (e) {
        Lib.logException('Member.delete', e);
        return {
            op: {
                status: false,
                msg: '删除失败',
            },
        };
    }
};

Book.updateStatus = function*(ids, Active) {
    try {
        yield global.db.query(`Update Book Set Active =? Where BookId in (${ids.join(",")})`,Active);
        return {
            op: {
                status: true,
                msg: 'ids=' + ids.join(",") + ', 操作成功 ',
            },
        };
    } catch (e) {
        Lib.logException('Book.in', e);
        return {
            op: {
                status: false,
                msg: '操作失败',
            },
        };
    }
};


Book.add = function*(values) {
    try {
        const result = yield global.db.query('Insert Into Book Set ?', values);
        return {
            op: {
                status: true,
                msg: values.Name + '添加成功, id=' + result[0].insertId,
            },
        };
    } catch (e) {
        Lib.logException('Book.add', e);
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

            default:
                return {
                    op: {
                        status: false,
                        msg: '添加失败',
                    },
                };
        }
    }
}
