'use strict';

const MemberDao = require('../models/member.js');
const Lib = require('../lib/lib.js');
const _ = require('lodash');
const bcrypt = require('co-bcrypt');    // bcrypt library
const member = module.exports = {};

member.suggest = function*() {
    this.body = yield MemberDao.suggest(this.query.name);
};


member.edit = function*() {
    const context = {
        module: {
            name: '客户',
            subName: '编辑',
        },
    };
    const res = yield MemberDao.get(this.params.id, this.passport.user);
    if(res.Active == 1){
        yield this.render('views/500-internal-server-error',{'message':"已审核的客户资料无法修改"});
    }else{
        yield this.render('views/member/edit', {
            module: context.module,
            data: res,
        });
    }
};


member.detail = function*() {
    let name ='客户';
    if(this.passport.user.Role == 'admin'){
        name ='系统管理'
    }
    const context = {
        module: {
            name: name,
            subName: '客户详情',
        },
    };
    const res = yield MemberDao.get(this.params.id,this.passport.user);
    yield this.render('views/member/detail', {
        module: context.module,
        data: res,
    });
};

member.list = function*() {
    let name ='客户';
    if(  this.passport.user.Role == 'admin'){
       name ='系统管理'
    }
    yield this.render('views/member/list', {
        module: {
            name: name,
            subName: '客户列表',
        }
    });
};

member.amountLogQuery = function*(){
    const values  = this.query
    const User = this.passport.user
    if(User.Role != 'admin'){
        values['UserId'] = User.UserId
    }
    const res = yield MemberDao.amountLogQuery(values);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
}

member.ajaxQuery = function*() {
    const query = this.query
    const User = this.passport.user
    const{ Name,Code} = query
    delete query['Name']
    delete query['Code']
    const likeValue = {}
    if(Name && Name !=''){
        likeValue['Name'] = "%"+Name+"%";
    }
    if(Code && Code != ''){
        likeValue['Code'] = "%"+Code+"%";
    }

    if(User.Role != 'admin'){
        query['UserId']= User.UserId
    }

    const res = yield MemberDao.list(query, likeValue);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};

member.add = function*() {
    const context = {
        module: {
            name: '客户',
            subName: '添加客户',
        },
    };
    yield this.render('views/member/add', context);
};


member.processAdd = function*() {
    const values = this.request.body.fields
    const {IDPic, DrivingPic, PolicyPic, Remarks} = this.request.body.files
    const path = this.envConfig.upload;
    values['IDPic'] = yield Lib.upload(IDPic, path)
    values['DrivingPic'] = yield Lib.upload(DrivingPic, path)
    values['PolicyPic'] = yield Lib.upload(PolicyPic, path)
    values['Remarks'] = yield Lib.upload(Remarks, path)
    values['Active'] = '0'
    values['UserId'] = this.passport.user.UserId
    this.flash = yield MemberDao.add(values);
    this.redirect('/member/add');
};

member.processDelete = function*() {
    const res = yield MemberDao.delete(_.values(this.request.body), this.passport.user);
    this.body = {data: res}
};

member.processAddAmount = function*() {
    const {AddAmount, MemberId} = this.request.body
    const res = yield MemberDao.addAmount(AddAmount,MemberId, this.passport.user);
    if(res <= 0){
        this.status = 500
    }
    this.body = {data: res}
}

member.processEdit = function*() {
    const values = this.request.body.fields
    delete values['Active']
    const res = yield MemberDao.get(this.params.id,this.passport.user);
    if(res.Active == 1){
        this.flash = {
            op: {
                status: false,
                msg: values.Name + '已审核的客户资料无法修改, id=' + this.params.id,
            }
        }
        this.redirect('/member/list');
    } else{
        const {IDPic, DrivingPic, PolicyPic,Remarks} = this.request.body.files
        if (IDPic) {
            values['IDPic'] = yield Lib.upload(IDPic, this.envConfig.upload)
        } else {
            delete values['IDPic'];
        }
        if (DrivingPic) {
            values['DrivingPic'] = yield Lib.upload(DrivingPic, this.envConfig.upload)
        } else {
            delete values['DrivingPic'];
        }
        if (PolicyPic) {
            values['PolicyPic'] = yield Lib.upload(PolicyPic, this.envConfig.upload)
        } else {
            delete values['PolicyPic'];
        }
        if (Remarks) {
            values['Remarks'] = yield Lib.upload(Remarks, this.envConfig.upload)
        } else {
            delete values['Remarks'];
        }
        this.flash = yield MemberDao.update(this.params.id,this.passport.user, values);
        this.redirect('/member/list');
    }
};
