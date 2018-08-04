const config = require('../../config')
const util = require('../../utils/util')

let deviceBLE_msg = {} // 保存了 deviceId、serviceId、write_CharacteristicsId、targetAddr、ownAddr、seed 
let deviceBLE_msg_list = []  // 保存所有连接设备的信息列表
let open_id = ''
let tstamp    // 新的时间戳
let timeArray // 接收到的倒计时数组
let connected = true // 连接状态标志

/** 初始化蓝牙模块 */
const openBluetoothAdapter = () => {
  wx.openBluetoothAdapter({
    complete: res => {
      console.log('openBluetoothAdapter ------ ', res)
      onBluetoothAdapterStateChange()
    }
  })
}

/** 监听手机蓝牙状态的改变
 * 
 *  可用于处理当用户关掉蓝牙时进行处理
 */
function onBluetoothAdapterStateChange() {
  wx.onBluetoothAdapterStateChange(res => {
    console.log('onBluetoothAdapterStateChange ----- ', res)
  })
}

/** 获取手机蓝牙的状态 */
const getBluetoothAdapterState = (mac_id, user_openId, callback) => {
  wx.getBluetoothAdapterState({
    success: res => {
      console.log('getBluetoothAdapterState ---- ', res)
      if (!res.available) {
        util.showModal('操作失败', '请先打开手机蓝牙再进行操作！')
        callback && callback({available: false, conn: false})
      } else {
        util.showBusy('正在连接')
        deviceBLE_msg.deviceId = mac_id
        open_id = user_openId
        // 先判断设备是否已连接过
        if (isConn(mac_id))
          createBLEConnection(mac_id, callback)
        else
          startBluetoothDevicesDiscovery(mac_id, callback)
      }
    }
  })
}

function startBluetoothDevicesDiscovery(deviceId, callback) {
  wx.startBluetoothDevicesDiscovery({
    //service: ['1E948DF1483194BA754C3E5000003D71'],
    success: function (res) {
      console.log(res)
      onBluetoothDeviceFound(deviceId, callback)
      //getBluetoothDevices()
    }
  })
}

function onBluetoothDeviceFound(deviceId, callback) {
  wx.onBluetoothDeviceFound(res => {
    console.log(res)
    if (res.devices[0].deviceId === deviceId) {
      createBLEConnection(deviceId, callback)
      stopBluetoothDevicesDiscovery()
    }
  })
}

function stopBluetoothDevicesDiscovery() {
  wx.stopBluetoothDevicesDiscovery({
    success: res => {
      console.log('stopBluetoothDevicesDiscovery ---- ', res)
    }
  })
}

/** 连接低功耗蓝牙设备 */
function createBLEConnection(deviceId, callback) {
  wx.createBLEConnection({
    deviceId: deviceId,
    success: res => {
      console.log('createBLEConnection ----- ', res)
      connected = true
      getBLEDeviceServices(deviceId, callback)
    }, 
    fail: res => {
      console.log('createBLEConnection ----- ', res)
    }
  })
}

/** getBLEDeviceServices 和  getBLEDeviceCharacteristics 主要用于获取与设备进行数据交互的特征值 */

/** 获取蓝牙设备的所有service */
function getBLEDeviceServices(deviceId, callback) {
  wx.getBLEDeviceServices({
    deviceId: deviceId,
    success: res => {
      console.log('getBLEDeviceServices----- ', res)
      deviceBLE_msg.serviceId = res.services[0].uuid
      getBLEDeviceCharacteristics(deviceId, res.services[0].uuid, callback)
    }
  })
}

/** 获取蓝牙设备某个服务中的所有特征值 */
function getBLEDeviceCharacteristics(deviceId, serviceId, callback) {
  wx.getBLEDeviceCharacteristics({
    deviceId: deviceId,
    serviceId: serviceId,
    success: res => {
      console.log('getBLEDeviceCharacteristics ----- ', res)
      let notify_CharacteristicsId = ''
      for (let i = 0; i < res.characteristics.length; i++) {
        if (res.characteristics[i].properties.notify)
          notify_CharacteristicsId = res.characteristics[i].uuid
        if (res.characteristics[i].properties.write)
          deviceBLE_msg.write_CharacteristicsId = res.characteristics[i].uuid
      }
      deviceBLE_msg_list.push(deviceBLE_msg)
      notifyBLECharacteristicValueChange(deviceId, serviceId, notify_CharacteristicsId, callback)
    }
  })
}

/** 启用低功耗蓝牙设备特征值变化时的notify功能，只有先启用notify才能监听到设备characteristicValueChange事件 */
function notifyBLECharacteristicValueChange(deviceId, serviceId, notify_CharacteristicsId, callback) {
  wx.notifyBLECharacteristicValueChange({
    state: true, // 启用 notify 功能
    deviceId: deviceId,
    // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
    serviceId: serviceId,
    // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
    characteristicId: notify_CharacteristicsId,
    success: res => {
      console.log('notifyBLECharacteristicValueChange ------- ', res.errMsg)
      onBLECharacteristicValueChange(deviceId, callback)
      onBLEConnectionStateChange()
    }
  })
}

/** 监听低功耗蓝牙设备的特征值变化，主要是通过该接口来接收设备回发的数据 */
function onBLECharacteristicValueChange(deviceId, callback) {
  wx.onBLECharacteristicValueChange(res => {
    // 可以通过 typeof res.value 来判断收到的数据
    verifyPkg(res.value, deviceId, callback)
  })

  // 到这里已经完成了与设备的连接，现在主要是通过通讯来注册安全协议
  util.showBusy('建立安全连接')
  generateHandshakePkg(deviceId, res => {
    sendData(deviceId, res)
  })
}

function onBLEConnectionStateChange() {
  wx.onBLEConnectionStateChange(res => {
    // 该方法回调中可以用于处理连接意外断开等异常情况
    console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
    if (!res.connected) 
      connected = false
  })
}

/** 向低功耗蓝牙设备特征值中写入二进制数据，主要是用于发送数据 */
const sendData = (deviceId, value) => {
  let serviceId, write_CharacteristicsId
  deviceBLE_msg_list.some(item => {
    if (item.deviceId === deviceId) {
      serviceId = item.serviceId
      write_CharacteristicsId = item.write_CharacteristicsId
      return true
    }
  })
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
    serviceId: serviceId,
    // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
    characteristicId: write_CharacteristicsId,
    // 这里的value是ArrayBuffer类型
    value: value,
    success: function(res) {
      console.log('writeBLECharacteristicValue success', res.errMsg)
    }
  })
}

function closeBLEConnection(deviceId, callback) {
  wx.closeBLEConnection({
    deviceId:deviceId,
    success: function (res) {
      console.log('closeBLEConnection ------ ', res)
      callback && callback(true)
    }
  })
}

// 建立安全连接时发送的握手包
function generateHandshakePkg(deviceId, callback) {
  const handshakePkg = new ArrayBuffer(16)
  let array = new Int8Array(handshakePkg)

  // pkg 第一个四字节 ====> flag
  array[0] = 0x1A;
  array[1] = 0x1B;
  array[2] = 0x1C;
  array[3] = 0x1D;
  // pkg 第二个四字节 ====> open_id前四个字符的ASCII值
  for (let i = 0; i < 4; i++)
    array[i + 4] = open_id.charCodeAt(i) // 将open_id的前4个字符分别转换为十进制的ASCII码
  // 请求服务器获取第三和第四个字节  =====>  密钥key 和 时间戳

  doRequest('getKey', {table: 'ctrlRecord', values: {mac_id: deviceId}}, res => {
    const key = res             // 密钥

    // key填入 8 ~ 11 字节
    array[11] = (key >> 24) & 0xFF
    array[10] = (key >> 16) & 0xFF
    array[9] = (key >> 8) & 0xFF
    array[8] = key & 0xFF

    // 生成新的时间戳，并将时间戳转换为二进制表示，放入最后4个字节当中
    tstamp = (new Date()).getTime() % (2^32)
    array[15] = (tstamp >> 24) & 0xFF
    array[14] = (tstamp >> 16) & 0xFF
    array[13] = (tstamp >> 8) & 0xFF
    array[12] = tstamp & 0xFF

    callback(handshakePkg) // 通过回调函数返回值
  })
}

// 建立安全连接后对设备返回的信息进行验证处理
function verifyPkg(rec_array, deviceId, callback) {
  const array = new Int8Array(rec_array)    // array是一个对象
  if (Object.keys(array).length === 16) {   
    if (array[0] == 255 && array[1] == 255 && array[2] == 255 && array[3] == 255) 
      return

    // 连接成功
    let r_key = 0
    r_key = (array[3] & 0xFF) << 24
    r_key = r_key | ((array[2] & 0xFF) << 16)
    r_key = r_key | ((array[1] & 0xFF) << 8)
    r_key = r_key | (array[0] & 0xFF)

    // 将设备发回的密钥发送到服务器进行验证
    doRequest('verify', {key: r_key, table: 'ctrlRecord', values: {open_id: open_id.substring(0, 4), tstamp: tstamp}, params: {mac_id: deviceId}}, res => {
      if (res) {
        let peerAddr = new Int8Array(6)
        let ownAddr = new Int8Array(6)
        let j = 0
        for (let i = 10; i < 16; i++)
          peerAddr[j++] = array[i]
        j = 0
        for (let i = 4; i < 10; i++)
          ownAddr[j++] = array[i]

        deviceBLE_msg_list.some(item => {
          if (item.deviceId === deviceId) {
            item.targetAddr = peerAddr
            item.ownAddr = ownAddr
            item.seed = Math.floor(Math.random() * (100 + 1))
            return true
          }
        })

        util.showSuccess('安全连接已建立')
        callback({available: true, conn: true})
      } else {
          // 没有建立安全连接
      }
    })
  }
  else    // 发送的是时间
    timeArray = array
}

// 建立卸载安全连接的验证包
function generateUninstallPkg() {
  const pkg = new ArrayBuffer(16)
  let array = new Int8Array(pkg)

  array[0] = 0xAA; array[1] = 0xAB; array[2] = 0xAC; array[3] = 0xAD;
  for (let i = 4; i < 16; i++)
    array[i] = 0xFF;

  return pkg;
}

// 卸载安全协议
const uninstallNetwork = (deviceId, callback) => {
  const uninstallPkg = generateUninstallPkg()

  sendData(deviceId, uninstallPkg)

  closeBLEConnection(deviceId, callback)
}

const sendFrame = (mac_id, send_array, callback) => {
  let ownAddr, targetAddr, seed, index = 0
  deviceBLE_msg_list.some((item, i) => {
    if (item.deviceId === mac_id) {
      ownAddr = item.ownAddr
      targetAddr = item.targetAddr
      seed = item.seed
      index = i
      return true
    }
  })
  // generate pkg #1
  const pkg1 = new ArrayBuffer(16);
  let array1 = new Int8Array(pkg1);
  // flag: 0x11 0x22 0x33 0x44
  array1[0] = 0x11; array1[1] = 0x22; array1[2] = 0x33; array1[3] = 0x44;
  let j = 0;
  for (let i = 4; i < 10; i++)
    array1[i] = ownAddr[j++];
  j = 0;
  for (let i = 10; i < 16; i++)
    array1[i] = targetAddr[j++];

  // generate pkg #2
  let pkg2 = new ArrayBuffer(16);
  let array2 = new Int8Array(pkg2);
  let seq = seed;

  // convert 32 bits seq
  array2[3] = (seq >> 24) & 0xFF;
  array2[2] = (seq >> 16) & 0xFF;
  array2[1] = (seq >> 8) & 0xFF;
  array2[0] = seq & 0xFF;
  j = 0;
  for (let i = 4; i < 16; i++)
    array2[i] = send_array[j++];

  deviceBLE_msg_list[index].seed = monteCarlo(seed)

  sendData(mac_id, pkg1)

  setTimeout(() => {
    sendData(mac_id, pkg2)
  }, 1000);

  callback(true)
}

function monteCarlo(seed) {
  const a = 9301;
  const b = 49297;
  const m = 233280;
  return (seed * a + b) % m;
}

function doRequest(url, data, callback) {
  wx.request({
    url: `${config.service.host}/weapp/${url}`,
    method: "POST",
    data: data,
    complete(result) {
      result = result.data.data
      callback(result) // 通过回调函数将pkg返回
    }
  })
}

const sendTime = callback => {
  callback(timeArray)
}

const sendState = callback => {
  callback(connected)
}

function isConn(mac_id) {
  for (let i = 0; i < deviceBLE_msg_list.length; i++) 
    if (deviceBLE_msg_list[i].deviceId === mac_id)
      return true
  
  return false
}

module.exports = {
  openBluetoothAdapter: openBluetoothAdapter,
  getBluetoothAdapterState: getBluetoothAdapterState,
  uninstallNetwork: uninstallNetwork,
  sendData: sendData,
  sendFrame: sendFrame,
  sendTime: sendTime,
  sendState: sendState
}