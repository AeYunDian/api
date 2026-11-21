// 地理数据的编码 / 名称映射

/** 中国省级两位码 → 中文名 */
export const CN_PROVINCE_NAMES = {
  BJ: '北京',
  TJ: '天津',
  HE: '河北',
  SX: '山西',
  NM: '内蒙古',
  LN: '辽宁',
  JL: '吉林',
  HL: '黑龙江',
  SH: '上海',
  JS: '江苏',
  ZJ: '浙江',
  AH: '安徽',
  FJ: '福建',
  JX: '江西',
  SD: '山东',
  HA: '河南',
  HB: '湖北',
  HN: '湖南',
  GD: '广东',
  GX: '广西',
  HI: '海南',
  CQ: '重庆',
  SC: '四川',
  GZ: '贵州',
  YN: '云南',
  XZ: '西藏',
  SN: '陕西',
  GS: '甘肃',
  QH: '青海',
  NX: '宁夏',
  XJ: '新疆',
  TW: '台湾',
  HK: '香港',
  MO: '澳门',
}

/** 中国省级两位码 → @svg-maps/china 的 location id（拼音） */
export const CN_PROVINCE_MAP_IDS = {
  AH: 'anhui',
  BJ: 'beijing',
  CQ: 'chongqing',
  FJ: 'fujian',
  GS: 'gansu',
  GD: 'guangdong',
  GX: 'guangxi-zhuang',
  GZ: 'guizhou',
  HI: 'hainan',
  HE: 'hebei',
  HL: 'heilongjiang',
  HA: 'henan',
  HK: 'hong-kong',
  HB: 'hubei',
  HN: 'hunan',
  JS: 'jiangsu',
  JX: 'jiangxi',
  JL: 'jilin',
  LN: 'liaoning',
  MO: 'macau',
  NM: 'nei-mongol',
  NX: 'ningxia-hui',
  QH: 'quinghai',
  SN: 'shaanxi',
  SD: 'shandong',
  SH: 'shanghai',
  SX: 'shanxi',
  SC: 'sichuan',
  TJ: 'tianjin',
  XJ: 'xinjiang-uygur',
  XZ: 'xizang',
  YN: 'yunnan',
  ZJ: 'zhejiang',
  TW: 'taiwan',
}

export function provinceName(code) {
  const key = String(code || '').toUpperCase()
  return CN_PROVINCE_NAMES[key] || key
}

export function provinceMapId(code) {
  const key = String(code || '').toUpperCase()
  return CN_PROVINCE_MAP_IDS[key] || key.toLowerCase()
}

/** 世界地图的 location id 就是 ISO 3166-1 alpha-2 的小写 */
export function countryMapId(code) {
  return String(code || '').toLowerCase()
}

let regionNames = null
try {
  regionNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' })
} catch {
  regionNames = null
}

export function countryName(code) {
  const key = String(code || '').toUpperCase()
  if (!key) return ''
  try {
    return regionNames?.of(key) || key
  } catch {
    return key
  }
}
