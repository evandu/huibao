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
    const res = yield MemberDao.get(this.params.id);
    yield this.render('views/member/edit', {
        module: context.module,
        data: res,
    });
};


member.detail = function*() {
    const context = {
        module: {
            name: '客户',
            subName: '客户详情',
        },
    };
    const res = yield MemberDao.get(this.params.id);
    yield this.render('views/member/detail', {
        module: context.module,
        data: res,
    });
};

member.list = function*() {
    yield this.render('views/member/list', {
        module: {
            name: '客户',
            subName: '客户列表',
        }
    });
};

member.ajaxQuery = function*() {
    const query = this.query
    const FeatureCode = this.passport.user.FeatureCode
    let inputFeatureCode = query['FeatureCode']
    if (!inputFeatureCode || !_.startsWith(inputFeatureCode, FeatureCode)) {
        inputFeatureCode = FeatureCode
    }
    delete query['FeatureCode']
    const res = yield MemberDao.list(query, {'FeatureCode': inputFeatureCode + '%'});
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
    const {GroupType} = values
    if (GroupType == '1') {
        const {IDPic, DrivingPic, PolicyPic} = this.request.body.files
        values['IDPic'] = yield Lib.upload(IDPic,this.envConfig.upload)
        values['DrivingPic'] = yield Lib.upload(DrivingPic,this.envConfig.upload)
        values['PolicyPic'] = yield Lib.upload(PolicyPic,this.envConfig.upload)
    } else {
        delete values['IDPic'];
        delete values['DrivingPic'];
        delete values['PolicyPic'];
    }
    values['FeatureCode'] = this.passport.user.FeatureCode
    this.flash = yield MemberDao.add(values);
    this.redirect('/member/add');
};

member.processDelete = function*() {
    const res = yield MemberDao.delete(_.values(this.request.body));
    if (!res.op.status) {
        this.status = 500
    }
    this.body = {data: res}
};

member.processEdit = function*() {

    const values = this.request.body.fields
    const {GroupType} = values
    if(GroupType == '2'){
        if (!values.Password || values.Password == '') {
            delete values['Password'];
        } else {
            const salt = yield bcrypt.genSalt(10)
            values.Password = yield bcrypt.hash(values.Password, salt);
        }
        delete values['IDPic'];
        delete values['DrivingPic'];
        delete values['PolicyPic'];
    }else {
        delete values['Password'];
        if (GroupType == 1) {
            const {IDPic, DrivingPic, PolicyPic} = this.request.body.files
            if(IDPic){
                values['IDPic'] = yield Lib.upload(IDPic,this.envConfig.upload)
            }else{
                delete values['IDPic'];
            }
            if(DrivingPic){
                values['DrivingPic'] = yield Lib.upload(DrivingPic,this.envConfig.upload)
            }else{
                delete values['DrivingPic'];
            }
            if(PolicyPic){
                values['PolicyPic'] = yield Lib.upload(PolicyPic,this.envConfig.upload)
            }else{
                delete values['PolicyPic'];
            }
        }
    }

    this.flash = yield MemberDao.update(this.params.id, values);
    this.redirect('/member/list');
};
