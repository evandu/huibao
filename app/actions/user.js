'use strict';

const UserDao       = require('../models/user.js');
const bcrypt        = require('co-bcrypt');    // bcrypt library

const user = module.exports = {};

user.edit =function*(){
    const context = {
        module: {
            name:    '系统管理',
            subName: '编辑账号',
        },
    };
    const res = yield UserDao.get(this.params.id || this.passport.user.UserId );
    yield this.render('views/user/edit',{
        module: context.module,
        data:   res,
    });
};

user.list =function*(){
    const context = {
        module: {
            name:    '系统管理',
            subName: '账号列表',
        },
    };
    const res = yield UserDao.list();
    yield this.render('views/user/list',{
        module: context.module,
        data:   res,
    });
};

user.add =function*(){
    const context = {
        module: {
            name:    '系统管理',
            subName: '添加账号',
        },
    };
    yield this.render('views/user/add',context);
};

user.processAdd = function*(){
    this.flash = yield UserDao.add(this.request.body);
    this.redirect('/user/add');
};

user.processDelete = function*(){
    this.flash = yield UserDao.delete(this.params.id);
    this.redirect('/user/list');
};

user.processEdit = function*(){
    if(!this.request.body.Password || this.request.body.Password == ''){
        delete this.request.body.Password;
    }else{
        const salt = yield bcrypt.genSalt(10)
        this.request.body.Password  = yield bcrypt.hash(this.request.body.Password,salt);
    }
    this.flash =  yield UserDao.update(this.params.id || this.passport.user.UserId, this.request.body);
    this.redirect('/inventory/list');
};
