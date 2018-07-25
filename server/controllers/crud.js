const { mysql } = require('../qcloud')

module.exports = {
  create: async ctx => {
    const { table, values } = ctx.request.body
    const res = await mysql(table).insert(values)
    ctx.state.data = res
  },

  query: async ctx => {
    const { table, values } = ctx.request.body   // params 按照 json 的格式
    const res = await mysql(table).where(values)
    ctx.state.data = res
  },

  update: async ctx => {
    const { table, values, where } = ctx.request.body
    const res = await mysql(table).update(values).where(where)
    ctx.state.data = res
  },

  del: async ctx => {
    const res = await mysql('device').del().where({ name: 'demo3' })
    ctx.state.data = res
  }
}
