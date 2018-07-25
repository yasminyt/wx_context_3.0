const { mysql } = require('../qcloud')

module.exports = {
  create: async ctx => {
    const device = {
      mac_id: '11:22:33:44',
      name: 'demo2',
      product_time: '2017/08/24 12:30:40'
    }

    const res = await mysql('device').insert(device)
    ctx.state.data = res
  },

  query: async ctx => {
    const { table, params } = ctx.request.body   // params 按照 json 的格式
    console.log(params)
    const res = await mysql(table).where(params)
    ctx.state.data = res
  },

  update: async ctx => {
    const res = await mysql('device').update({ name: 'demo3' }).where({ name: 'demo2' })
    ctx.state.data = res
  },

  del: async ctx => {
    const res = await mysql('device').del().where({ name: 'demo3' })
    ctx.state.data = res
  }
}
