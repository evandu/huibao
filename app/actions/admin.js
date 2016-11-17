'use strict';

const UserDao = require('../models/user.js');
const MemberDao = require('../models/member.js');
const _ = require('lodash');
const bcrypt = require('co-bcrypt');    // bcrypt library

const InventoryDao    = require('../models/inventory.js');

const admin = module.exports = {};

admin.list = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '公司列表',
        },
    };
    yield this.render('views/admin/list', context);
};

admin.ajaxQuery = function*() {
    const values = this.query
    const {Name} = values
    delete values["Name"]
    const res = yield UserDao.list(values, {"Name": "%" + Name + "%"});
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
}

admin.add = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '添加公司',
        }
    };
    yield this.render('views/admin/add', context);
};

admin.processAdd = function*() {
    const values = this.request.body
    const salt = yield bcrypt.genSalt(10)
    values.Password = yield bcrypt.hash(values.Password, salt);
    delete values['Amount'];
    yield UserDao.insert(values);
    this.flash = {op: {status: true, msg: '添加成功'}};
    this.redirect('/admin/add');
};


admin.memberAudit = function* () {
    const {MemberId,Active} = this.request.body
    yield MemberDao.audit(MemberId,Active)
    if(Active == "1"){
        this.flash = {op: {status: true, msg: '审核成功，审核通过'}};
    }else {
        this.flash = {op: {status: true, msg: '审核成功，审核未通过'}};
    }
    this.redirect('/member/list');
}


admin.processDelete = function*() {
    const res = yield UserDao.delete(_.values(this.request.body));
    this.body = {data: res}
};


admin.edit = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '编辑公司',
        },
    };
    const res = yield UserDao.get(this.params.id || this.passport.user.UserId);
    yield this.render('views/admin/edit', {
        module: context.module,
        data: res,
    });
};

admin.processEdit = function*() {
    if (!this.request.body.Password || this.request.body.Password == '') {
        delete this.request.body.Password;
    } else {
        const salt = yield bcrypt.genSalt(10)
        this.request.body.Password = yield bcrypt.hash(this.request.body.Password, salt);
    }
    delete this.request.body['Amount'];
    this.flash = yield UserDao.update(this.params.id || this.passport.user.UserId, this.request.body);
    this.flash = {op: {status: true, msg: '编辑成功'}};
    this.redirect('/admin/list');
};


admin.inventoryAdd =function*(){
    const context = {
        module: {
            name:    '系统管理',
            subName: '添加库存',
        },
    };
    yield this.render('views/admin/inventory/add',context);
};

admin.inventoryProcessAdd = function*(){
    this.request.body['UserId']  = this.passport.user.UserId
    this.flash = yield InventoryDao.add(this.request.body);
    this.redirect('/admin/inventory/add');
};

admin.inventoryOut =function*(){
    const context = {
        module: {
            name:    '系统管理',
            subName: '出库到公司',
        },
    };
    yield this.render('views/admin/inventory/out',context);
};

admin.userSuggest = function*() {
    this.body = yield UserDao.suggest(this.query.name);
};
