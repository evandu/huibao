'use strict';

const MemberDao       = require('../models/member.js');
const Lib        = require('../lib/lib.js');
const _ = require('lodash');

const member = module.exports = {};

member.suggest =function*(){
    this.body = yield MemberDao.suggest(this.query.name);
};


member.edit =function*(){
    const context = {
        module: {
            name:    '客户',
            subName: '编辑',
        },
    };
    const res = yield MemberDao.get(this.params.id);
    yield this.render('views/member/edit',{
        module: context.module,
        data:   res,
    });
};


member.detail =function*(){
    const context = {
        module: {
            name:    '客户',
            subName: '客户详情',
        },
    };
    const res = yield MemberDao.get(this.params.id);
    yield this.render('views/member/detail',{
        module: context.module,
        data:   res,
    });
};

member.list =function*(){
    yield this.render('views/member/list',{
        module: {
            name:    '客户',
            subName: '客户列表',
        }
    });
};

member.ajaxQuery =function*(){
    const res = yield MemberDao.list(this.query);

    const data = _.map(orders.orders, order=> {
        order.Deposit = order.Deposit / 100.0
        order.PayServiceAmount = order.PayServiceAmount / 100.0
        order.PromotePrice = order.PromotePrice / 100.0
        //order.PayDepositAmount = order.PayDepositAmount / 100.0
        order.ServicePrice = order.ServicePrice / 100.0
        order.Status = Order.Status[order.Status]
        //  order.RefundDepositStatus = Order.RefundDepositStatus[order.RefundDepositStatus]
        order.UserInfo = `${order.Name} ${order.Gender == '1' ? '男' : '女'} ${order.Age}岁 ${order.Height} cm ${order.Weight} kg`
        order.AddressInfo = `${order.Area} ${order.Address}`
        order.CreateDate = moment(order.CreateDate).format('YYYY-MM-DD HH:mm:ss')
        order.UseDate = moment(order.UseDate).format('YYYY-MM-DD')
        order.LastUpdateDate = moment(order.LastUpdateDate).format('YYYY-MM-DD HH:mm:ss')
        return order
    })
    this.body = {data: orders}

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
    this.request.body['FeatureCode'] = this.passport.user.FeatureCode
    this.flash = yield MemberDao.add(this.request.body);
    this.redirect('/member/add');
};

member.processDelete = function*(){
    this.flash = yield MemberDao.delete(this.params.id);
    this.redirect('/member/list');
};

member.processEdit = function*(){
    this.flash =  yield MemberDao.update(this.params.id, this.request.body);
    this.redirect('/member/list');
};
