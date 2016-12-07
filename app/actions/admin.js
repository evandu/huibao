'use strict';

const UserDao = require('../models/user.js');
const MemberDao = require('../models/member.js');
const _ = require('lodash');
const bcrypt = require('co-bcrypt');    // bcrypt library
const BookDao = require('../models/book.js');

const InventoryDao = require('../models/inventory.js');

const admin = module.exports = {};

admin.userSuggest = function*() {
    this.body = yield UserDao.suggest(this.query.name);
};

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
    const {Name} = this.query
    const likeValues = {}
    if (Name && Name != '') {
        likeValues['Name'] = "%" + Name + "%"
    }
    const res = yield UserDao.list({"Role": 'sub'}, likeValues);
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
    values.Role = 'sub';
    delete values['Amount'];
    yield UserDao.insert(values);
    this.flash = {op: {status: true, msg: '添加成功'}};
    this.redirect('/admin/add');
};

admin.memberAudit = function*() {
    const {MemberId, Active} = this.request.body
    yield MemberDao.audit(MemberId, Active, this.passport.user)
    if (Active == "1") {
        this.flash = {op: {status: true, msg: '审核成功，审核通过'}};
    } else {
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

admin.inventoryAdd = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '添加库存',
        },
    };
    yield this.render('views/admin/inventory/add', context);
};

admin.inventoryProcessAdd = function*() {
    this.request.body['UserId'] = this.passport.user.UserId
    this.request.body['Active'] = '1';
    this.flash = yield InventoryDao.add(this.request.body);
    this.redirect('/admin/inventory/add');
};

admin.inventoryOut = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '出库到公司',
        },
    };
    yield this.render('views/admin/inventory/out', context);
};

admin.processConfirm = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '出库到公司',
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
        const User = yield UserDao.get(this.request.body.UserId);
        context.User = User;
        context.inventories = inventories.map(function (o) {
            if (o.Num < _Inventory[o.InventoryId]) {
                self.flash = {
                    op: {
                        status: false,
                        msg: '“' + o.Name + '” 库存不足,库存为：' + o.Num + ', 出库为：' + _Inventory[o.InventoryId]
                    },
                };
                self.redirect('/admin/inventory/out');
            } else {
                o.Num = _Inventory[o.InventoryId];
            }
            return o;
        });

        context.Sum = inventories.reduce(function (item, next) {
            return item + next.Num * next.Price;
        }, 0);
        if (context.Sum > User.Amount) {
            context.tips = {
                status: true,
                msg: User.Name + ' 账号金额不足。<br/>账号金额为：' + User.Amount + ' 元 <br/> 出库金额为：' + context.Sum + ' 元。<br/> 差价：' + (context.Sum - User.Amount) + ' 元',
            };
        }
    }
    yield self.render('views/admin/inventory/confirm', context);
};

admin.processOut = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '出库到公司',
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
        const User = yield UserDao.get(this.request.body.UserId);
        context.User = User;
        let inventories = yield InventoryDao.idIn(InventoryIds, this.passport.user);
        let Sum = 0;
        _.forEach(inventories, function (o) {
            if (o.Num < _Inventory[o.InventoryId]) {
                self.flash = {
                    op: {
                        status: false,
                        msg: '“' + o.Name + '” 库存不足,库存为：' + o.Num + ', 出库为：' + _Inventory[o.InventoryId]
                    },
                };
                self.redirect('/admin/inventory/out');
            }
            Sum += o.Price * _Inventory[o.InventoryId];
        });

        yield InventoryDao.out(_Inventory, this.passport.user)

        yield UserDao.minusAmount(User.UserId, Math.abs(Sum));

        const inventoryLog = inventories.map(function (o) {
            o.Num = _Inventory[o.InventoryId];
            o.Operator = self.passport.user.Name;
            o.TargetId = User.UserId;
            o.Active = 0;
            delete o.CreateDate;
            delete o.LastUpdateDate;
            return o;
        });

        for (let i = 0; i < inventoryLog.length; i++) {
            yield InventoryDao.addLog(inventoryLog[i]);
        }

        self.flash = {op: {status: true, msg: '出库成功'}};
        self.redirect('/admin/inventory/out', context);
    } else {
        self.flash = {op: {status: false, msg: '出库操作失败'}};
        self.redirect('/admin/inventory/out', context);
    }
};


admin.userLog = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '出库日志'
        }
    };
    context.Target = this.params.id
    yield this.render('views/admin/inventory/log', context);
};


admin.userLogAjaxQuery = function*() {
    const values = this.query
    values["a.UserId"] = this.passport.user.UserId
    values["a.TargetId"] = values["TargetId"]
    delete values["TargetId"]

    const res = yield InventoryDao.log(values);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


admin.inventoryList = function*() {
    yield this.render('views/admin/inventory/list', {
        module: {
            name: '系统管理',
            subName: '库存列表'
        }
    });
};


admin.inventoryAjaxQuery = function*() {
    const query = this.query
    const {Name} = query
    const likeValue = {}
    if (Name && Name != '') {
        likeValue['Name'] = "%" + Name + "%"
    } else {
        delete query['Name']
    }
    delete query['Name']
    const UserId = query['UserId'];
    if (!UserId || UserId == '') {
        query['UserId'] = this.passport.user.UserId;
    }
    const res = yield InventoryDao.list(query, likeValue);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


admin.inventoryProcessDelete = function*() {
    const res = yield InventoryDao.delete(_.values(this.request.body), this.passport.user);
    this.body = {data: res}
};

admin.inventoryLog = function*() {
    const context = {
        module: {
            name: '系统管理',
            subName: '出库日志'
        }
    };
    context.Target = this.params.id
    yield this.render('views/admin/inventory/log', context);
};

admin.inventoryLogAjaxQuery = function*() {
    const values = this.query
    values["a.InventoryId"] = values["TargetId"]
    delete values["TargetId"]

    const res = yield InventoryDao.log(values);
    if (res.op) {
        this.status = 500
        this.body = {msg: res.op.msg}
    }
    this.body = {data: res}
};


admin.inventoryEdit = function*() {
    const inventoryId = this.params.id
    const res = yield InventoryDao.get(inventoryId, this.passport.user);
    yield this.render('views/admin/inventory/edit', {
        data: res,
        module: {
            name: '库存',
            subName: '编辑'
        }
    });
};


admin.inventoryProcessEdit = function*() {
    this.flash = yield InventoryDao.update(this.params.id, this.request.body, this.passport.user);
    this.redirect('/admin/inventory/list');
};


admin.orders = function*() {
    const query = this.query
    query['b.Active'] = '0';
    query['size'] = 10000;
    const res = yield BookDao.list(query, {});
    const map = _.groupBy(res.data, o=> o.InventoryId);
    const data = _.keys(map)
    const orders = []
    for (let i = 0; i < data.length; i++) {
        orders.push(
            _.reduce(map[data[i]], (item, sum)=>{
                if(item.BookId){
                    sum['BookId'] =  sum.BookId + "," + item.BookId ;
                    sum['Num'] = item.Num + sum.Num;
                }
                return sum;
            },{})
        )
    }
    if (res.op ==  false) {
        yield this.render('views/500-internal-server-error', {'message': res.op.msg});
    } else {
        yield this.render('views/book/orders', {
             data: orders,
             module: {
                name: '系统管理',
                subName: '预定列表',
            }
        });
    }

};
