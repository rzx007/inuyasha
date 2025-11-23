import prettier from 'prettier/standalone'
import babel from 'prettier/plugins/babel'
import estree from 'prettier/plugins/estree'
export function prettierCode(code: string, diasbled = false) {
  if (diasbled) {
    return code
  }
  try {
    // 参数1：代码字符串，参数2：格式化配置
    const preCode = prettier.format(code, {
      parser: 'babel',
      plugins: [babel, estree]
    })
    console.log('preCode', preCode)
    return preCode
  } catch (error) {
    // 如果格式化失败,返回源码
    return code
  }
}
