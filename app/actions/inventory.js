'use strict';

const InventoryDao    = require('../models/inventory.js');
const MemberDao       = require('../models/member.js');
const _ = require('lodash');
const inventory = module.exports = {};

inventory.suggest =function*(){
    this.body = yield InventoryDao.suggest(this.query.name,this.passport.user);
};

inventory.list =function*(){
    yield this.render('views/inventory/list',{
        module: {
            name:    '库存',
            subName: '列表',
        }
    });
};


inventory.inAjaxQuery = function*(){
    const values = this.query
    values["a.TargetId"] = this.passport.user.UserId
    values["a.Active"] = 0
    delete values["TargetId"]

    const res = yield InventoryDao.log(values);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


inventory.in = function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '入库'
        }
    };
    yield this.render('views/inventory/in', context);
};


inventory.processIn = function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '入库'
        }
    };
    yield this.render('views/inventory/in', context);
};


inventory.inventoryLogAjaxQuery = function*(){
    const values = this.query
    values["a.UserId"] = this.passport.user.UserId
    values["a.TargetId"] = values['TargetId']
    delete values['TargetId']
    const res = yield InventoryDao.memberLog(values);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


inventory.inventoryLog = function*(){
    const context = {
        module: {
            name:    '库存',
            subName: '出库日志'
        }
    };
    context.Target =  this.params.id
    yield this.render('views/inventory/log', context);
};



inventory.ajaxQuery = function*() {
    const{ Name} = this.query
    const likeValue = {}
    if(Name && Name != ''){
        likeValue['Name'] = "%" +Name + "%"
    }
    const res = yield InventoryDao.list({}, likeValue);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
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
