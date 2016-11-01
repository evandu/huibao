/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Library of assorted useful functions                                                          */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint esnext:true, node:true */
'use strict';

const _ = require('lodash');
const Lib = module.exports = {};


/**
 * Log or notify unhandled exception.
 *
 * @param method
 * @param e
 */
Lib.logException = function (method, e) {
    /* eslint no-console: 0 */
    // could eg save to log file or e-mail developer
    console.log('UNHANDLED EXCEPTION', method, e.stack === undefined ? e.message : e.stack);
};

Lib.FeatureCode = function (UserId) {
    return `${UserId}@`
}
//querySql, countSql,sumAmountSql
Lib.paging = function*(values, likeValues, sqlArray, formater) {
    values = _.merge({size: 10, cur: 1}, values);

    values.size = parseInt(values.size);
    values.cur = parseInt(values.cur);

    if (values.size < 0 || values.size > 100) {
        values.size = 10;
    }

    if (values.cur < 0) {
        values = 1
    }

    const pageStart = values.size * (values.cur - 1);
    const pageSize = values.size;
    const pageCur = values.cur;
    delete values['size']
    delete values['cur']

    _.forEach(values, function (value, key) {
        if (value == '') {
            delete value[key]
        }
    });

    const filter = Object.keys(values).map(function (q) {
        return q + ' = :' + q;
    }).join(' and ');

    const likeFilter = Object.keys(likeValues).map(function (q) {
        return q + ' like :' + q;
    }).join(' and ');

    const conArray = []
    if (filter && filter.length > 2) {
        conArray.push(filter)
    }
    if (likeFilter && likeFilter.length > 2) {
        conArray.push(likeFilter)
    }
    const con = conArray.join(' and ')

    values['pageStart'] = pageStart
    values['pageSize'] = pageSize
    values = _.merge(values, likeValues)

    if (conArray.length > 0) {
        sqlArray = _.map(sqlArray, sql=> sql.replace("$filter", `where ${con}`))
    } else {
        sqlArray = _.map(sqlArray, sql=> sql.replace("$filter", ''))
    }
    const [dataList] =  yield global.db.query({
        sql: sqlArray[0] + ' Limit :pageStart, :pageSize',
        namedPlaceholders: true
    }, values);

    const [[total]] =  yield global.db.query({sql: sqlArray[1], namedPlaceholders: true}, values);
    let sumAmount ={'sumAmount':0}
    if (sqlArray.length == 3) {
      [[sumAmount]] =  yield global.db.query({sql: sqlArray[2], namedPlaceholders: true}, values);
    }
    return {
        total: total['count'],
        sumAmount: sumAmount['sumAmount'] == null ? 0:sumAmount['sumAmount'],
        data: formater(dataList),
        size: pageSize,
        cur: pageCur
    }
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
