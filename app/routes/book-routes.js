
'use strict';

const router = require('koa-router')(); // router middleware for koa

const book = require('../actions/book.js');

router.get('/book/list',           book.list);
router.get('/book/ajaxQuery',      book.ajaxQuery);
router.get('/book/suggest',        book.suggest);
router.get('/book/add',            book.add);
router.post('/book/add',           book.processAdd);
router.post('/book/ajaxDelete',    book.processDelete);
router.post('/book/in',            book.in);
router.post('/book/!in',           book.notIn);

module.exports = router.middleware();
