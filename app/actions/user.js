'use strict';

const UserDao       = require('../models/user.js');

const user = module.exports = {};

user.modify =function*(){
    const context = {
        module: {
            name:    '系统管理',
            subName: '编辑账号',
        },
    };
    const res = yield UserDao.get(this.params.id);
    yield this.render('views/member/edit',{
        module: context.module,
        data:   res,
    });
};


user.edit =function*(){
    const context = {
        module: {
            name:    '系统管理',
            subName: '编辑账号',
        },
    };
    const res = yield UserDao.get(this.params.id);
    yield this.render('views/member/edit',{
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
    this.flash =  yield UserDao.update(this.params.id, this.request.body);
    this.redirect('/user/list');
};
