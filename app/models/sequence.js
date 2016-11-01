/**
 * Created by evan on 2016/8/28.
 */

'use strict';
const Sequence = module.exports = {};

Sequence.nextVal  = function *() {
    const  [[val]] =  yield global.db.query("select NEXTVAL('FeatureCode') as NextId")
    return val.NextId
}