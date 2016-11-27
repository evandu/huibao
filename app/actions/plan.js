
'use strict';

const PlanDao = require('../models/plan.js');
const _ = require('lodash');
const plan = module.exports = {};

plan.add = function*(){
    const context = {
        module: {
            name: '采购',
            subName: '添加采购',
        },
    };
    yield this.render('views/plan/add', context);
};


plan.processAdd = function*(){
    this.request.body['UserId']  = this.passport.user.UserId
    this.request.body['Active']  = '0';
    this.flash = yield PlanDao.add(this.request.body);
    this.redirect('/plan/list');
};


plan.list = function*() {
    let name ='采购';
    if(  this.passport.user.Role == 'admin'){
        name ='系统管理'
    }
    yield this.render('views/plan/list', {
        module: {
            name: name,
            subName: '采购列表',
        }
    });
};

plan.ajaxQuery = function*() {
    const query = this.query
    const User = this.passport.user
    const{ Name} = query
    delete query['Name']

    const likeValue = {}
    if(Name && Name !=''){
        likeValue['Name'] = "%"+Name+"%";
    }

    if(User.Role != 'admin'){
        query['UserId']= User.UserId
    }

    const res = yield PlanDao.list(query, likeValue);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


plan.processDelete = function*() {
    if(this.passport.user.Role != 'admin'){
        this.status = 500
        this.body = {msg: "删除失败"}
    }else{
        const res = yield PlanDao.delete(_.values(this.request.body), this.passport.user);
        this.body = {data: res}
    }
};

plan.in = function* () {
    if(this.passport.user.Role != 'admin'){
        this.status = 500
        this.body = {msg: "操作失败"}
    }else{
        const res = yield PlanDao.updateStatus(_.values(this.request.body), "1");
        this.body = {data: res}
    }
}

plan.notIn = function* () {
    if(this.passport.user.Role != 'admin'){
        this.status = 500
        this.body = {msg: "操作失败"}
    }else{
        const res = yield PlanDao.updateStatus(_.values(this.request.body), "2");
        this.body = {data: res}
    }
}