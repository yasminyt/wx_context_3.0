const {
  mysql
} = require('../qcloud')

module.exports = {
  create: async ctx => {
    const {
      table,
      values
    } = ctx.request.body
    ctx.state.data = await mysql(table).insert(values)
  },

  query: async ctx => {
    const {
      table,
      values
    } = ctx.request.body // params 按照 json 的格式
    ctx.state.data = await mysql(table).where(values)
  },

  // whereIn 子句的查询语句
  query_whereIn: async ctx => {
    const {
      table,
      value,
      array
    } = ctx.request.body
    ctx.state.data = await mysql(table).whereIn(value, array)
  },

  // 多表连接查询（这里主要用于用户授权和解除绑定两个页面获取设备使用）
  query_innerJoin: async ctx => {
    const {
      param
    } = ctx.request.body
    ctx.state.data = await mysql('authorization').where(param).whereNull('dis_auth_open_id').join('device', {
      'device.mac_id': 'authorization.mac_id'
    }).select('auth_id', 'device.mac_id', 'name')
  },

  // 查询某个字段
  query_select: async ctx => {
    const {
      table,
      value,
      param
    } = ctx.request.body
    ctx.state.data = await mysql(table).select(value).where(param)
  },

  // 用于查询用户拥有权限的设备
  query_device: async ctx => {
    const {
      openId
    } = ctx.request.body
    let mac_id = await mysql('authorization').select('mac_id').where('open_id', openId).whereNull('dis_auth_open_id')
    for (let i = 0; i < mac_id.length; i++)
      mac_id[i] = mac_id[i].mac_id
    ctx.state.data = await mysql('device').whereIn('mac_id', mac_id)
  },

  update: async ctx => {
    const {
      table,
      values,
      params
    } = ctx.request.body
    ctx.state.data = await mysql(table).update(values).where(params)
  },

  del: async ctx => {
    ctx.state.data = await mysql('device').del().where({
      name: 'demo3'
    })
  }
}