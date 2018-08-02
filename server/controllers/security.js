// 先根据请求的mac_id做数据库查询，得到三条记录
const {
  mysql
} = require('../qcloud')

let record = {}   // 初始记录

module.exports = {
  query: async ctx => {
    const {
      table,
      values
    } = ctx.request.body
    record = await mysql(table).where(values).first()
    console.log(record)
    ctx.state.data = getKey()
  },
  update: async ctx => {
    const {
      key,
      table,
      values,
      params
    } = ctx.request.body
    // 要先根据 record 中的 record_index 决定更新哪一条记录
    const up_openId = `open_id_${record.record_index}`,
          up_tstamp = `tstamp_${record.record_index}`
    let up_value = {}
    record[up_openId] = up_value[up_openId] = values.open_id,
    record[up_tstamp] = up_value[up_tstamp] = values.tstamp,
    record.record_index = up_value.record_index = ++record.record_index
    
    const res = await mysql(table).update(up_value).where(params)
    console.log(res)
    ctx.state.data = verify(key)
  }
}

function getKey() {
  let sum = 0
  for (let i = 1; i <= 3; i++) {    // 将三条记录中，微信号前4个字符的ASCII码以及时间戳加和
    sum += record[`open_id_${i}`]    
    sum += record[`tstmp_${i}`]
  }
  console.log(sum)
  return monteCarlo(sum)
}

function monteCarlo(seed) {
  var a = 9301;
  var b = 49297;
  var m = 233280;
  var rand_num = (seed * a + b) % m;
  return rand_num;
}

function verify(key) {
  const c_key = getKey()

  if (c_key === key)
    return true
  else
    return false
}