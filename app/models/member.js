'use strict';

const Lib = require('../lib/lib');
const bcrypt = require('co-bcrypt');
const Moment = require('moment');
const _ = require('lodash');

const ModelError = require('./modelerror');

const Member = module.exports = {};

Member.suggest = function*(name) {
    const result = yield global.db.query('Select * From Member Where Active =1 And Name like ? Or Code like ? limit 0, 10', ['%' + name + '%', '%' + name + '%']);
    return result[0].map(
        function (o) {
            return {
                FeatureCode: o.FeatureCode,
                MemberId: o.MemberId,
                Name: o.Name + '-' + o.Code,
                Amount: o.Amount + ' 元'
            };
        }
    );
};

Member.get = function*(id, User) {
    let result;
    if (User.Role == 'admin') {
        result = yield global.db.query('Select * From Member Where MemberId = ?', id)
    } else {
        result = yield global.db.query('Select * From Member Where MemberId = ? And UserId = ?', [id, User.UserId]);
    }
    const member = result[0][0];
    return member;
};

Member.delete = function*(ids, User) {
    try {
        if (User.Role == 'admin') {
            yield global.db.query(`Delete From Member Where MemberId in (${ids.join(",")})`);
        } else {
            yield global.db.query(`Delete From Member Where UserId = ? And MemberId in (${ids.join(",")})`, User.UserId);
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


Member.addAmount = function*(AddAmount, MemberId, User) {
    const AddResult = yield global.db.query('Insert Into MemberAmountLog Set ?',
        {
            MemberId: MemberId,
            Amount: AddAmount,
            Operator: User.Name,
            UserId: User.UserId,
            OperatorId: User.UserId
        }
    );
    const LogId = AddResult[0]['insertId']
    try {
        let result;
        if (User.Role == 'admin') {
            result = yield global.db.query(
                'Update Member Set Amount = Amount + ?, Active = 0 Where MemberId = ? ',
                [AddAmount, MemberId])
        } else {
            result = yield global.db.query(
                'Update Member Set Amount = Amount + ?, Active = 0 Where UserId = ? And MemberId = ? ',
                [AddAmount, User.UserId, MemberId])
        }

        const row = result[0]['affectedRows']
        if (row == 0) {
            throw ModelError(404, "");
        }
        return row
    } catch (e) {
        yield global.db.query('Delete From MemberAmountLog Where LogId = ?', LogId);
    }
}

Member.amountLogQuery = function*(values) {
    const QuerySql = 'Select * From MemberAmountLog $filter Order By CreateDate desc';
    const CountSql = 'Select count(*) as count From MemberAmountLog $filter ';
    const SumAmountSql = 'Select sum(Amount) as sumAmount From MemberAmountLog $filter ';
    try {
        return yield Lib.paging(values, {}, [QuerySql, CountSql, SumAmountSql], function (data) {
            return _.map(data, d=> {
                d.CreateDate = Moment(d.CreateDate).format('YYYY-MM-DD HH:mm:ss')
                d.Operator = d.Operator + '(' + d.OperatorId + ')'
                d.Amount = d.Amount + ' 元'
                return d;
            });
        });
    } catch (e) {
        Lib.logException('Member.Amount.Log', e);
        return {
            op: {
                status: false,
                msg: '数据查询失败',
            },
        };
    }
}

Member.audit =  function* (MemberId,Active,User) {
    yield global.db.query('Update Member Set Active=? Where MemberId = ?', [Active, MemberId]);
    const [[member]] = yield global.db.query('Select * From Member Where MemberId = ?', MemberId)
    yield global.db.query('Update User Set Amount = Amount + ? Where UserId in (?,?)', [member.Amount, member.UserId, User.UserId]);
}

Member.list = function*(values, likeValues) {
    const QuerySql = 'Select * From Member $filter Order By CreateDate, LastUpdateDate';
    const CountSql = 'Select count(*) as count From Member $filter ';
    const SumAmountSql = 'Select sum(Amount) as sumAmount From Member $filter ';
    try {
        return yield Lib.paging(values, likeValues, [QuerySql, CountSql, SumAmountSql], function (data) {
            return _.map(data, d=> {
                d.CreateDate = Moment(d.CreateDate).format('YYYY-MM-DD HH:mm:ss')
                if( d.Active == 1){
                    d.Active='已审核'
                }else if(d.Active == 2){
                    d.Active='审核不通过'
                }else{
                    d.Active='未审核'
                }
                d.Amount = d.Amount + " 元"
                d.LastUpdateDate = Moment(d.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
                return d;
            });
        });
    } catch (e) {
        Lib.logException('Member.List', e);
        return {
            op: {
                status: false,
                msg: '客户数据查询失败',
            },
        };
    }
};

Member.add = function*(values) {
    try {
        const result = yield global.db.query('Insert Into Member Set ?', values);
        return {
            op: {status: true, msg: values.Name + '添加客户成功, id=' + result[0].insertId},
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
                        msg: '请检查输入',
                    },
                };
            case 'ER_DUP_ENTRY':
                return {
                    op: {
                        status: false,
                        msg: '车牌重复,请重新填写',
                    },
                };
            default:
                return {
                    op: {
                        status: false,
                        msg: '添加客户失败',
                    },
                };
        }
    }
};

Member.update = function*(id, User, values) {
    try {
        if (User.Role == 'admin') {
            yield global.db.query('Update Member Set ? Where MemberId = ?', [values, id]);
        } else {
            yield global.db.query('Update Member Set ? Where UserId =? And MemberId = ?', [values, User.UserId, id]);
        }
        return {
            op: {
                status: true,
                msg: values.Name + '编辑成功, id=' + id,
            },
        };
    } catch (e) {
        Lib.logException('Member.update', e);
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
                        msg: '车牌重复,请重新填写',
                    },
                };
            default:
                return {
                    op: {
                        status: false,
                        msg: '编辑客户失败',
                    },
                };
        }
    }
};


Member.minusAmount = function*(id, User, Amount) {
    try {
        if (User.Role == 'admin') {
            yield global.db.query('Update Member Set Amount = Amount - ? Where MemberId = ?', [Amount, id]);
        } else {
            yield global.db.query('Update Member Set Amount = Amount - ? Where UserId =? And MemberId = ?', [Amount, User.UserId, id]);
        }
        return {
            op: {
                status: true,
                msg: '编辑成功, id=' + id,
            },
        };
    } catch (e) {
        Lib.logException('Member.update', e);
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
                        msg: '编辑客户失败',
                    },
                };
        }
    }
};