'use strict';

const InventoryDao    = require('../models/inventory.js');
const MemberDao       = require('../models/member.js');
const _ = require('lodash');
const inventory = module.exports = {};


inventory.suggest =function*(){
    const FeatureCode = this.passport.user.FeatureCode
    this.body = yield InventoryDao.suggest(this.query.name,FeatureCode);
};

inventory.edit =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '编辑',
        },
    };
    const FeatureCode = this.passport.user.FeatureCode
    const res = yield InventoryDao.get(this.params.id,FeatureCode);
    yield this.render('views/inventory/edit',{
        module: context.module,
        data:   res,
    });
};


inventory.list =function*(){
    yield this.render('views/inventory/list',{
        module: {
            name:    '库存',
            subName: '列表',
        }
    });
};


inventory.ajaxQuery = function*() {
    const query = this.query
    const FeatureCode = this.passport.user.FeatureCode
    let inputFeatureCode = query['FeatureCode']
    if (!inputFeatureCode || !_.startsWith(inputFeatureCode, FeatureCode)) {
        inputFeatureCode = FeatureCode
    }
    delete query['FeatureCode']
    const res = yield InventoryDao.list(query, {'FeatureCode':  '%' + inputFeatureCode + '%'});
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


inventory.log =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '出库日志',
        },
    };
    const res = yield InventoryDao.log(this.query.InventoryId, this.query.MemberId);
    yield this.render('views/inventory/log',{
        module: context.module,
        data:   res,
    });
};



inventory.add =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '入库',
        },
    };
    yield this.render('views/inventory/add',context);
};



inventory.out =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '出库',
        },
    };
    yield this.render('views/inventory/out',context);
};


inventory.processAdd = function*(){
    this.request.body['FeatureCode']  = this.passport.user.FeatureCode
    this.request.body['UserId']  = this.passport.user.UserId
    this.flash = yield InventoryDao.add(this.request.body);
    this.redirect('/inventory/add');
};

inventory.processDelete = function*(){
    const FeatureCode = this.passport.user.FeatureCode
    const UserId = this.passport.user.UserId
    const res = yield InventoryDao.delete(_.values(this.request.body), FeatureCode,UserId);
    if (!res.op.status) {
        this.status = 500
    }
    this.body = {data: res}
};

inventory.processEdit = function*(){
    const FeatureCode = this.passport.user.FeatureCode
    const UserId = this.passport.user.UserId
    this.flash =  yield InventoryDao.update(this.params.id, this.request.body,FeatureCode,UserId);
    this.redirect('/inventory/list');
};

inventory.processConfirm =function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '出库',
        },
    };
    const self = this;
    const InventoryIds = this.request.body.InventoryId;
    const Nums = this.request.body.Num;
    if(InventoryIds || InventoryIds.length > 0){
        const _Inventory= {};
        for(let i=0; i<InventoryIds.length;i++){
            if(_Inventory[InventoryIds[i]]){
                _Inventory[InventoryIds[i]]  += parseInt(Nums[i]);
            }else{
                _Inventory[InventoryIds[i]] = parseInt(Nums[i]);
            }
        }
        const inventories = yield InventoryDao.idIn(InventoryIds);
        const member = yield MemberDao.get(this.request.body.MemberId);
        context.Member=member;
        context.inventories=inventories.map(function(o){
            if(o.Num < _Inventory[o.InventoryId] ){
                self.flash = {
                    op: {  status: false,  msg: '“'+o.Name + '” 库存不足,库存为：' + o.Num +', 出库为：' + _Inventory[o.InventoryId] },
                };
                self.redirect('/inventory/list');
            }else{
                o.Num =_Inventory[o.InventoryId];
            }
            return o;
        });

        context.Sum = inventories.reduce(function(item, next){return item + next.Num * next.Price;
        },0 );
        if(context.Sum > member.Amount){
            // self.flash = {
            //     op: {  status: false,  msg: member.Name +'-' +member.Code + ' 账户余额不足。 <br/> 账户余额为：' + member.Amount  + ' 元 <br/> 出库金额为：' + context.Sum + ' 元'  },
            // };
            // self.redirect('/inventory/list');
            context.tips = {
                status: true ,
                msg:    member.Name + '-' + member.Code + ' 账号金额不足。<br/>账号金额为：' + member.Amount  + ' 元 <br/> 出库金额为：' + context.Sum + ' 元。<br/> 差价：' + (context.Sum - member.Amount) + ' 元',
            };
        }
    }
    yield self.render('views/inventory/confirm', context);
};

inventory.processOut = function*(){
    const self = this;
    const InventoryIds = this.request.body.InventoryId;
    const Nums = this.request.body.Num;
    if(InventoryIds || InventoryIds.length > 0){
        const _Inventory= {};
        for(let i=0; i<InventoryIds.length;i++){
            if(_Inventory[InventoryIds[i]]){
                _Inventory[InventoryIds[i]]  += parseInt(Nums[i]);
            }else{
                _Inventory[InventoryIds[i]] = parseInt(Nums[i]);
            }
        }

        let inventories = yield InventoryDao.idIn(InventoryIds);
        const member = yield MemberDao.get(this.request.body.MemberId);
        let Sum = 0;
        inventories = inventories.map(function(o){
            if(o.Num < _Inventory[o.InventoryId] ){
                self.flash = {
                    op: {  status: false,  msg: '“'+o.Name + '” 库存不足,库存为：' + o.Num +', 出库为：' + _Inventory[o.InventoryId] },
                };
                self.redirect('/inventory/list');
            }else{
                o.Num = o.Num - _Inventory[o.InventoryId];
                Sum += o.Price * _Inventory[o.InventoryId];
            }
            return o;
        });
        // if(Sum > member.Amount){
        //     self.flash = {
        //         op: {  status: false,  msg: member.Name +'-' +member.Code + ' 账户余额不足,余额为：' + member.Amount  + ' 元' },
        //     };
        //     self.redirect('/inventory/list');
        // }
        for( let i=0; i<inventories.length; i++ ){
            yield InventoryDao.update(inventories[i].InventoryId, inventories[i]);
        }
        const inventoryLog = inventories.map(function(o){
            o.Num = _Inventory[o.InventoryId];
            o.Operator = self.passport.user.Name;
            o.MemberId = member.MemberId;
            delete o.CreateDate;
            delete o.LastUpdateDate;
            return o;
        });

        for( let i=0; i<inventoryLog.length; i++ ){
            yield InventoryDao.addlog(inventoryLog[i]);
        }

        member.Amount  = member.Amount - Sum;
        yield MemberDao.update(member.MemberId, member);
        self.flash = { op: {  status: true,  msg: '出库成功' } };
        self.redirect('/inventory/list');
    } else{
        self.flash = { op: {  status: false,  msg: '出库操作失败' } };
        self.redirect('/inventory/list');
    }
};
