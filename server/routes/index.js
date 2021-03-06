/**
 * ajax 服务路由集合
 */
const router = require('koa-router')({
    prefix: '/weapp'
})
const controllers = require('../controllers')

// 从 sdk 中取出中间件
// 这里展示如何使用 Koa 中间件完成登录态的颁发与验证
const { auth: { authorizationMiddleware, validationMiddleware } } = require('../qcloud')

// --- 登录与授权 Demo --- //
// 登录接口
router.get('/login', authorizationMiddleware, controllers.login)
// 用户信息接口（可以用来验证登录态）
router.get('/user', validationMiddleware, controllers.user)

// --- 图片上传 Demo --- //
// 图片上传接口，小程序端可以直接将 url 填入 wx.uploadFile 中
router.post('/upload', controllers.upload)

// --- 信道服务接口 Demo --- //
// GET  用来响应请求信道地址的
router.get('/tunnel', controllers.tunnel.get)
// POST 用来处理信道传递过来的消息
router.post('/tunnel', controllers.tunnel.post)

// --- 客服消息接口 Demo --- //
// GET  用来响应小程序后台配置时发送的验证请求
router.get('/message', controllers.message.get)
// POST 用来处理微信转发过来的客服消息
router.post('/message', controllers.message.post)

// 处理数据库请求
router.post('/create', controllers.crud.create)
router.post('/query', controllers.crud.query)
router.post('/query_whereIn', controllers.crud.query_whereIn)
router.post('/query_innerJoin', controllers.crud.query_innerJoin)
router.post('/query_multi_leftJoin', controllers.crud.query_multi_leftJoin)
router.post('/query_orderBy', controllers.crud.query_orderBy)
router.post('/query_select', controllers.crud.query_select)
router.post('/query_device', controllers.crud.query_device)
router.post('/update', controllers.crud.update)

// 安全协议
router.post('/getKey', controllers.security.query)
router.post('/verify', controllers.security.update)

module.exports = router
