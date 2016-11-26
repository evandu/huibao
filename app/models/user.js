'use strict';

const Lib = require('../lib/lib.js');
const ModelError = require('./modelerror.js');
const _ = require('lodash');
const Moment = require('moment');
const User = module.exports = {};

/**
 * Returns User details (convenience wrapper for single User details).
 *
 * @param   {number} id - User id or undefined if not found.
 * @returns {Object} User details.
 */
User.get = function*(id) {
    const result = yield global.db.query('Select * From User Where UserId = ?', id);
    const users = result[0];
    return users[0];
};


User.suggest = function*(name) {
    const result = yield global.db.query("Select * From User Where Role='sub' And Active =1 And Name like ?  limit 0, 10", '%' + name + '%');
    return result[0].map(
        function (o) {
            return {
                UserId: o.UserId,
                Name: o.Name,
                Amount: o.Amount + ' 元'
            };
        }
    );
};


/**
 * Returns Users with given field matching given value.
 *
 * @param   {string}        field - Field to be matched.
 * @param   {string!number} value - Value to match against field.
 * @returns {Object[]}      Users details.
 */
User.getBy = function*(field, value) {
    try {

        const sql = `Select * From User Where Active = 1 And ${field} = ? Order By CreateDate`;

        const result = yield global.db.query(sql, value);
        const users = result[0];

        return users;

    } catch (e) {
        switch (e.code) {
            case 'ER_BAD_FIELD_ERROR':
                throw ModelError(403, 'Unrecognised User field ' + field);
            default:
                Lib.logException('User.getBy', e);
                throw ModelError(500, e.message);
        }
    }
};


/**
 * Creates new User record.
 *
 * @param   {Object} values - User details.
 * @returns {number} New user id.
 * @throws  Error on validation or referential integrity errors.
 */
User.insert = function*(values) {
    try {
        const result = yield global.db.query('Insert Into User Set ?', values);
        //console.log('User.insert', result.insertId, new Date); // eg audit trail?
        return result[0].insertId;
    } catch (e) {
        switch (e.code) {
            // recognised errors for User.update - just use default MySQL messages for now
            case 'ER_BAD_NULL_ERROR':
            case 'ER_NO_REFERENCED_ROW_2':
            case 'ER_NO_DEFAULT_FOR_FIELD':
                throw ModelError(403, e.message); // Forbidden
            case 'ER_DUP_ENTRY':
                throw ModelError(409, e.message); // Conflict
            default:
                Lib.logException('User.insert', e);
                throw ModelError(500, e.message); // Internal Server Error
        }
    }
};


User.list = function*(values, likeValues) {
    const QuerySql = 'Select * From User $filter Order By CreateDate, LastUpdateDate';
    const CountSql = 'Select count(*) as count From User $filter ';
    const SumAmountSql = 'Select sum(Amount) as sumAmount From User $filter ';
    try {
        return yield Lib.paging(values, likeValues, [QuerySql, CountSql, SumAmountSql], function (data) {
            return _.map(data, d=> {
                d.Active = d.Active == 1 ? "启用" : "禁用"
                d.Amount = d.Amount + " 元"
                d.CreateDate = Moment(d.CreateDate).format('YYYY-MM-DD HH:mm:ss')
                d.LastUpdateDate = Moment(d.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
                return d;
            });
        });
    } catch (e) {
        Lib.logException('User.List', e);
        return {
            op: {
                status: false,
                msg: '数据查询失败',
            },
        };
    }
};


/**
 * Update User details.
 *
 * @param  {number} id - User id.
 * @param  {Object} values - User details.
 * @throws Error on referential integrity errors.
 */
User.update = function*(id, values) {
    try {

        yield global.db.query('Update User Set ? Where UserId = ?', [values, id]);
        //console.log('User.update', id, new Date); // eg audit trail?

    } catch (e) {
        switch (e.code) {
            case 'ER_BAD_NULL_ERROR':
            case 'ER_DUP_ENTRY':
                // recognised errors for User.update - just use default MySQL messages for now
                throw ModelError(403, e.message); // Forbidden
            default:
                Lib.logException('User.update', e);
                throw ModelError(500, e.message); // Internal Server Error
        }
    }
};


/**
 * Delete User record.
 *
 * @param  {number} id - User id.
 * @throws Error
 */
User.delete = function*(ids) {
    try {

        yield global.db.query(`Delete From User Where UserId in (${ids.join(",")})`);
        //console.log('User.delete', id, new Date); // eg audit trail?

    } catch (e) {
        switch (e.code) {
            default:
                Lib.logException('User.delete', e);
                throw ModelError(500, e.message); // Internal Server Error
        }
    }
};


User.minusAmount = function*(id, amount) {
    try {
        yield global.db.query('Update User Set Amount = Amount - ? Where UserId = ?', [amount, id]);
    } catch (e) {
        switch (e.code) {
            case 'ER_BAD_NULL_ERROR':
            case 'ER_DUP_ENTRY':
                // recognised errors for User.update - just use default MySQL messages for now
                throw ModelError(403, e.message); // Forbidden
            default:
                Lib.logException('User.updateAmount', e);
                throw ModelError(500, e.message); // Internal Server Error
        }
    }
};



/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
