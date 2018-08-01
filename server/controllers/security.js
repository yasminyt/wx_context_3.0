// 先根据请求的mac_id做数据库查询，得到三条记录

function getKey(recordList) {
    let sum = 0
    for (let i = 0; i < recordList.lenght; i++) 
        sum += recordList[i]    // 将三条记录中，微信号前4个字符的ASCII码以及时间戳加和

    return monteCarlo(sum)
    
}

function monteCarlo(seed) {
    var a = 9301;
	var b = 49297;
	var m = 233280;
	var rand_num = (seed * a + b) % m;
	return rand_num;
}