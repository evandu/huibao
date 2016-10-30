'use strict';

const Lib        = require('../lib/lib.js');
const bcrypt        = require('co-bcrypt');
const Member = module.exports = {};

Member.suggest = function*(name) {
    const result = yield global.db.query('Select * From Member Where  Name like ? Or Code like ? limit 0, 10', ['%' + name + '%', '%' + name  + '%']);
    return  result[0].map(
      function(o){
          return { MemberId: o.MemberId, Name: o.Name + '-' + o.Code, Amount: o.Amount +' 元' };
      }
    );
};


Member.get = function*(id) {
    const result = yield global.db.query('Select * From Member Where MemberId = ?', id);
    const member = result[0][0];
    const GroupType = member.GroupType
    if(GroupType == 2){
        const UserId = member.UserId
        const UserResult = yield global.db.query('Select * From User Where UserId = ?', UserId);
        member['Email'] = UserResult[0][0]['Email']
    }
    console.log(member)
    return member;
};

Member.delete = function*(id){
    try{
        yield global.db.query('Delete From Member Where MemberId = ?', id);
        return {
            op: {
                status: true,
                msg:    'id=' + id + ', 删除成功',
            },
        };
    }catch(e) {
        Lib.logException('Member.delete', e);
        return {
            op: {
                status: false,
                msg:    '删除失败',
            },
        };
    }
};

Member.list = function*(GroupType){
    const sql = 'Select * From Member Where GroupType = ? Order By CreateDate, LastUpdateDate';
    try{
        const result = yield global.db.query(sql, [GroupType]);
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
        if(values['GroupType'] == '2'){
            values['Code'] = values['Email']
            const salt = yield bcrypt.genSalt(10)
            values['Password']  = yield bcrypt.hash(values['Password'],salt);
            const User = {
                Password:values['Password'],
                Email:values['Email'],
                Name:values['Name'],
                FeatureCode:values['FeatureCode']
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
                if(values['GroupType'] == '2'){
                    return {
                        op: {
                            status: false,
                            msg:    '企业账号重复,请重新填写',
                        },
                    };
                }else{
                    return {
                        op: {
                            status: false,
                            msg:    '车牌重复,请重新填写',
                        },
                    };
                }
            default:
                return {
                    op: {
                        status: false,
                        msg:    '添加客户失败',
                    },
                };
        }
    }
};

Member.update = function*(id,values) {
    try {
        yield global.db.query('Update Member Set ? Where MemberId = ?', [values, id]);
        return {
            op: {
                status: true,
                msg:    values.Name + '编辑成功, id=' + id,
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
                        msg:    '请检查输入',
                    },
                };
            case 'ER_DUP_ENTRY':
                return {
                    op: {
                        status: false,
                        msg:    '车牌重复,请重新填写',
                    },
                };
            default:
                return {
                    op: {
                        status: false,
                        msg:    '编辑客户失败',
                    },
                };
        }
    }
};
