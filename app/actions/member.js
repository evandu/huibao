'use strict';

const MemberDao       = require('../models/member.js');

const member = module.exports = {};

member.list =function*(){
    const context = {
        module: {
            name:    '客户',
            subName: '客户列表',
        },
    };
    const res = yield MemberDao.list();
    yield this.render('views/member/list',{
        module: context.module,
        data:   res,
        sum:    res.reduce(function(item, next){return item + next.Amount;},0 ),
    });
};

member.add =function*(){
    const context = {
        module: {
            name:    '客户',
            subName: '添加客户',
        },
    };
    yield this.render('views/member/add',context);
};


member.processAdd = function*(){
    this.flash = yield MemberDao.add(this.request.body);
    this.redirect('/member/add');
};