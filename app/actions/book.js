
'use strict';

const BookDao = require('../models/book.js');
const _ = require('lodash');
const book = module.exports = {};

book.add = function*(){
    const context = {
        module: {
            name: '订购',
            subName: '添加订购',
        },
    };
    yield this.render('views/book/add', context);
};


book.processAdd = function*(){
    this.request.body['UserId']  = this.passport.user.UserId
    this.request.body['Active']  = '0';
    this.flash = yield BookDao.add(this.request.body);
    this.redirect('/book/list');
};


book.list = function*() {
    let name ='订购';
    if(  this.passport.user.Role == 'admin'){
        name ='系统管理'
    }
    yield this.render('views/book/list', {
        module: {
            name: name,
            subName: '订购列表',
        }
    });
};

book.ajaxQuery = function*() {
    const query = this.query
    const User = this.passport.user
    const{ Name} = query
    delete query['Name']

    const likeValue = {}

    if(Name && Name !=''){
        likeValue['b.Name'] = "%"+Name+"%";
    }

    if(User.Role != 'admin'){
        query['b.UserId']= User.UserId
    }

    const res = yield BookDao.list(query, likeValue);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


book.processDelete = function*() {
    if(this.passport.user.Role != 'admin'){
        this.status = 500
        this.body = {msg: "删除失败"}
    }else{
        const res = yield BookDao.delete(_.values(this.request.body), this.passport.user);
        this.body = {data: res}
    }
};

book.in = function* () {
    if(this.passport.user.Role != 'admin'){
        this.status = 500
        this.body = {msg: "操作失败"}
    }else{
        const res = yield BookDao.updateStatus(_.values(this.request.body), "1");
        this.body = {data: res}
    }
}

book.notIn = function* () {
    if(this.passport.user.Role != 'admin'){
        this.status = 500
        this.body = {msg: "操作失败"}
    }else{
        const res = yield BookDao.updateStatus(_.values(this.request.body), "2");
        this.body = {data: res}
    }
}