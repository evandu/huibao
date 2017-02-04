'use strict';

const InventoryDao = require('../models/inventory.js');
const MemberDao = require('../models/member.js');
const _ = require('lodash');
const inventory = module.exports = {};

inventory.suggest = function*() {
    this.body = yield InventoryDao.suggest(this.query.name, this.passport.user);
};

inventory.list = function*() {
    yield this.render('views/inventory/list', {
        module: {
            name: '库存',
            subName: '列表',
        }
    });
};


inventory.inAjaxQuery = function*() {
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


inventory.in = function*() {
    const context = {
        module: {
            name: '库存',
            subName: '入库'
        }
    };
    yield this.render('views/inventory/in', context);
};

inventory.processNotIn = function*() {
    const values = this.request.body
    const logs = yield InventoryDao.logIdIn(_.values(values), this.passport.user);
    for (let i = 0; i < logs.length; i++) {
        yield InventoryDao.updateNum(logs[i].InventoryId, logs[i].Num, {UserId: logs[i].UserId})
        yield InventoryDao.updateLogStatus(logs[i].LogId, this.passport.user, "3")
    }
    this.body = {data: "success"}
}

inventory.processIn = function*() {
    const values = this.request.body
    const logs = yield InventoryDao.logIdIn(_.values(values), this.passport.user);

    for (let i = 0; i < logs.length; i++) {
        let Inventory = yield InventoryDao.find(logs[i].Name, logs[i].Price, this.passport.user)

        if (Inventory) {
            yield InventoryDao.updateNum(Inventory.InventoryId, logs[i].Num, this.passport.user)
        } else {
            Inventory = {
                'Name': logs[i].Name,
                'Price': logs[i].Price,
                'Num': logs[i].Num,
                'UserId': this.passport.user.UserId,
                'Active': 1
            }
            yield InventoryDao.add(Inventory)
        }
        yield InventoryDao.updateLogStatus(logs[i].LogId, this.passport.user, "3")
    }
    this.body = {data: "success"}
};


inventory.memberLogAjaxQuery = function*() {
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


inventory.memberLog = function*() {
    let name = '库存';
    if (this.passport.user.Role == 'admin') {
        name = '系统管理'
    }
    const context = {
        module: {
            name: name,
            subName: '出库日志'
        }
    };
    context.Target = this.params.id
    yield this.render('views/inventory/log', context);
};


inventory.inventoryLogAjaxQuery = function*() {
    const values = this.query
    values["a.UserId"] = this.passport.user.UserId
    values["a.InventoryId"] = values['TargetId']
    delete values['TargetId']
    const res = yield InventoryDao.memberLog(values);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


inventory.inventoryLog = function*() {
    const context = {
        module: {
            name: '库存',
            subName: '出库日志'
        }
    };
    context.Target = this.params.id
    yield this.render('views/inventory/log', context);
};


inventory.ajaxQuery = function*() {
    const {Name, cur,size} = this.query
    const likeValue = {}
    if (Name && Name != '') {
        likeValue['Name'] = "%" + Name + "%"
    }

    const res = yield InventoryDao.list({'UserId': this.passport.user.UserId, cur, size}, likeValue);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};

inventory.out = function*() {
    const context = {
        module: {
            name: '库存',
            subName: '出库',
        },
    };
    yield this.render('views/inventory/out', context);
};

inventory.processConfirm = function*() {
    const context = {
        module: {
            name: '库存',
            subName: '出库',
        },
    };
    const self = this;
    const InventoryIds = this.request.body.InventoryId;
    const Nums = this.request.body.Num;
    if (InventoryIds || InventoryIds.length > 0) {
        const _Inventory = {};
        for (let i = 0; i < InventoryIds.length; i++) {
            if (_Inventory[InventoryIds[i]]) {
                _Inventory[InventoryIds[i]] += parseInt(Nums[i]);
            } else {
                _Inventory[InventoryIds[i]] = parseInt(Nums[i]);
            }
        }
        const inventories = yield InventoryDao.idIn(InventoryIds, this.passport.user);
        const member = yield MemberDao.get(this.request.body.MemberId, this.passport.user);
        if(member.Active != 1){
            self.flash = {op: {status: false, msg: '客户未审核，无法出库'}};
            self.redirect('/inventory/list');
        }
        context.Member = member;
        context.inventories = inventories.map(function (o) {
            if (o.Num < _Inventory[o.InventoryId]) {
                self.flash = {
                    op: {
                        status: false,
                        msg: '“' + o.Name + '” 库存不足,库存为：' + o.Num + ', 出库为：' + _Inventory[o.InventoryId]
                    },
                };
                self.redirect('/inventory/list');
            } else {
                o.Num = _Inventory[o.InventoryId];
            }
            return o;
        });

        context.Sum = inventories.reduce(function (item, next) {
            return item + next.Num * next.Price;
        }, 0);
        if (context.Sum > member.Amount) {
            // self.flash = {
            //     op: {  status: false,  msg: member.Name +'-' +member.Code + ' 账户余额不足。 <br/> 账户余额为：' + member.Amount  + ' 元 <br/> 出库金额为：' + context.Sum + ' 元'  },
            // };
            // self.redirect('/inventory/list');
            context.tips = {
                status: true,
                msg: member.Name + '-' + member.Code + ' 账号金额不足。<br/>账号金额为：' + member.Amount + ' 元 <br/> 出库金额为：' + context.Sum + ' 元。<br/> 差价：' + (context.Sum - member.Amount) + ' 元',
            };
        }
    }
    yield self.render('views/inventory/confirm', context);
};

inventory.processOut = function*() {
    const self = this;
    const InventoryIds = this.request.body.InventoryId;
    const Nums = this.request.body.Num;
    if (InventoryIds || InventoryIds.length > 0) {
        const _Inventory = {};
        for (let i = 0; i < InventoryIds.length; i++) {
            if (_Inventory[InventoryIds[i]]) {
                _Inventory[InventoryIds[i]] += parseInt(Nums[i]);
            } else {
                _Inventory[InventoryIds[i]] = parseInt(Nums[i]);
            }
        }

        let inventories = yield InventoryDao.idIn(InventoryIds, this.passport.user);
        const member = yield MemberDao.get(this.request.body.MemberId, this.passport.user);
        let Sum = 0;
        inventories = inventories.map(function (o) {
            if (o.Num < _Inventory[o.InventoryId]) {
                self.flash = {
                    op: {
                        status: false,
                        msg: '“' + o.Name + '” 库存不足,库存为：' + o.Num + ', 出库为：' + _Inventory[o.InventoryId]
                    },
                };
                self.redirect('/inventory/list');
            } else {
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

        yield InventoryDao.out(_Inventory, this.passport.user)

        const inventoryLog = inventories.map(function (o) {
            o.Active   = 1;
            o.Num = _Inventory[o.InventoryId];
            o.Operator = self.passport.user.Name;
            o.TargetId = member.MemberId;
            o.UserId = self.passport.user.UserId;
            delete o.CreateDate;
            delete o.LastUpdateDate;
            return o;
        });

        for (let i = 0; i < inventoryLog.length; i++) {
            yield InventoryDao.addLog(inventoryLog[i]);
        }

        yield MemberDao.minusAmount(member.MemberId, this.passport.user, Math.abs(Sum));

        self.flash = {op: {status: true, msg: '出库成功'}};
        self.redirect('/inventory/list');
    } else {
        self.flash = {op: {status: false, msg: '出库操作失败'}};
        self.redirect('/inventory/list');
    }
};


