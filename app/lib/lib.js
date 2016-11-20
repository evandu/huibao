/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Library of assorted useful functions                                                          */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint esnext:true, node:true */
'use strict';

const _ = require('lodash');

const fs = require('fs')
const path = require('path')
const Moment = require('moment');
const Cryptiles = require('cryptiles');

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


Lib.randomString = function (length) {
    if (!length || length <= 0 || length > 64) {
        length = 16
    }
    const buffer = Cryptiles.randomBits((length + 1) * 6);
    if (buffer instanceof Error) {
        return buffer;
    }
    const string = buffer.toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').replace(/\=/g, 'C');
    return string.slice(0, length);
}


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
        const d = q.split(".");
        return q + ' = :' + (d.length ==1?d[0]:d[1]);
    }).join(' and ');

    const likeFilter = Object.keys(likeValues).map(function (q) {
        const d = q.split(".");
        return q + ' like :' + (d.length ==1?d[0]:d[1]);
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
    const _values = {}

    _.keys(values).map(key=>{
        const d = key.split(".");
        const _key = (d.length ==1?d[0]:d[1])
        _values[_key] =  values[key];
    })
    if (conArray.length > 0) {
        sqlArray = _.map(sqlArray, sql=> sql.replace("$filter", `where ${con}`))
    } else {
        sqlArray = _.map(sqlArray, sql=> sql.replace("$filter", ''))
    }

    console.log(sqlArray)

    const [dataList] =  yield global.db.query({
        sql: sqlArray[0] + ' Limit :pageStart, :pageSize',
        namedPlaceholders: true
    }, _values);


    const [[total]] =  yield global.db.query({sql: sqlArray[1], namedPlaceholders: true}, _values);
    let sumAmount = {'sumAmount': 0}
    if (sqlArray.length == 3) {
        [[sumAmount]] = yield global.db.query({sql: sqlArray[2], namedPlaceholders: true}, _values);
    }
    return {
        total: total['count'],
        sumAmount: sumAmount['sumAmount'] == null ? 0 : sumAmount['sumAmount'],
        data: formater(dataList),
        size: pageSize,
        cur: pageCur
    }
}

Lib.upload = function*(item, key1) {
   return new Promise((resolve, reject) => {
        if (item && item.size > 0) {
            try {
                const nameArray = item['name'].split('.');
                const ext = nameArray[nameArray.length - 1];
                const uploadPath = path.join(key1, Moment().format('YYYYMMDD'))
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath);
                }
                const fileUploadFilePath = path.join(uploadPath, Lib.randomString(10) + Moment().format('HHmmss') + "." + ext);
                var stream = fs.createWriteStream(fileUploadFilePath);
                fs.createReadStream(item['path']).pipe(stream);
                resolve(fileUploadFilePath.replace(key1, "").replace(/\\+/g, "/"))
            } catch (e) {
                reject("上传文件失败")
            }
        } else {
            resolve("")
        }
    }).then(data =>data ,err=>{
        console.log(err)
        return err
    });
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
