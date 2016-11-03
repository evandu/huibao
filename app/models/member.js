'use strict';

const Lib = require('../lib/lib.js');
const bcrypt = require('co-bcrypt');
const Sequence = require('./sequence.js');
const Moment = require('moment');
const _ = require('lodash');
const Member = module.exports = {};

Member.suggest = function*(name) {
    const result = yield global.db.query('Select * From Member Where  Name like ? Or Code like ? limit 0, 10', ['%' + name + '%', '%' + name + '%']);
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


Member.get = function*(id) {
    const result = yield global.db.query('Select * From Member Where MemberId = ?', id);
    const member = result[0][0];
    const GroupType = member.GroupType
    if (GroupType == 2) {
        const UserId = member.UserId
        const UserResult = yield global.db.query('Select * From User Where UserId = ?', UserId);
        member['Email'] = UserResult[0][0]['Email']
    }
    return member;
};

Member.delete = function*(ids) {
    try {
        const [UserIds] =  yield global.db.query(`Select UserId From Member Where MemberId in (${ids.join(",")})`)
        const deleteUserId = _.filter(_.map(UserIds, d=>d.UserId), d=>d && d != '')
        if (deleteUserId.length > 0) {
            yield global.db.query(`Delete From User Where UserId in (${deleteUserId.join(",")})`);
        }
        yield global.db.query(`Delete From Member Where MemberId in (${ids.join(",")})`);
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
    const AddResult =  yield global.db.query('Insert Into MemberAmountLog Set ?',
        {
            MemberId: MemberId,
            Amount: AddAmount,
            Operator: User.Name,
            OperatorId: User.UserId
        }
    );
    const LogId =   AddResult[0]['insertId']
    try {
        const result = yield global.db.query('Update Member Set Amount = Amount + ? Where MemberId = ? and FeatureCode like ? ',
            [AddAmount, MemberId, '%' + User.FeatureCode + '%']);
        return result[0]['affectedRows']
    } catch (e) {
        yield global.db.query('Delete From MemberAmountLog Where LogId = ?', LogId);
    }
}

Member.amountLogQuery = function* (values) {
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


Member.list = function*(values, likeValues) {
    const QuerySql = 'Select * From Member $filter Order By CreateDate, LastUpdateDate';
    const CountSql = 'Select count(*) as count From Member $filter ';
    const SumAmountSql = 'Select sum(Amount) as sumAmount From Member $filter ';
    try {
        return yield Lib.paging(values, likeValues, [QuerySql, CountSql, SumAmountSql], function (data) {
            return _.map(data, d=> {
                d.CreateDate = Moment(d.CreateDate).format('YYYY-MM-DD HH:mm:ss')
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
        if (values['GroupType'] == '2') {
            values['Code'] = values['Email']
            const salt = yield bcrypt.genSalt(10)
            values['Password'] = yield bcrypt.hash(values['Password'], salt);
            const FeatureCode = yield Sequence.nextVal()
            values['FeatureCode'] = values['FeatureCode'] + Lib.FeatureCode(FeatureCode)
            const User = {
                Password: values['Password'],
                Email: values['Email'],
                Name: values['Name'],
                FeatureCode: values['FeatureCode']
            }
            delete values['Password']
            delete values['Email']
            const userAddResult = yield global.db.query('Insert Into User Set ?', User);
            values['UserId'] = userAddResult[0]['insertId']
        }
        const result = yield global.db.query('Insert Into Member Set ?', values);
        return {
            op: {
                status: true,
                msg: values.Name + '添加客户成功, id=' + result[0].insertId,
            },
        };
    } catch (e) {
        Lib.logException('Member.insert', e);
        if (values['UserId']) {
            yield global.db.query('Delete From User Where UserId = ?', values['UserId']);
        }
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
                if (values['GroupType'] == '2') {
                    return {
                        op: {
                            status: false,
                            msg: '企业账号重复,请重新填写',
                        },
                    };
                } else {
                    return {
                        op: {
                            status: false,
                            msg: '车牌重复,请重新填写',
                        },
                    };
                }
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

Member.update = function*(id, values) {
    try {
        delete values['GroupType']
        const result = yield global.db.query('Select * From Member Where MemberId = ?', id);
        const member = result[0][0];
        const Password = values.Password
        delete values['Password']
        yield global.db.query('Update Member Set ? Where MemberId = ?', [values, id]);
        if (Password || member.Code != values.Code) {
            if (member.GroupType == 2) {
                let updateUser = {'Email': values.Code}
                if (Password) {
                    updateUser = _.merge(updateUser, {"Password": Password})
                }
                yield global.db.query('Update User Set ? Where UserId = ?', [updateUser, member.UserId]);
            }
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
