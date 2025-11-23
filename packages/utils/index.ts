// 判断是对象还是字符串
export const isObject = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Object]'
}

// 对象转换为css

export const toCss = (obj: any) => {
  if (!obj) {
    return ''
  }
  return Object.keys(obj)
    .map(key => `${key}:${obj[key]}`)
    .join(';')
}

// 判断字符串是否是数字
export const isNumber = (value: string) => {
  return /^\d+$/.test(value)
}

export const parseJsStrToLte = (code: string): string => {
  // 匹配 {{}} 的内容
  const regex = /\{\{(.+?)\}\}/g

  // {{}} -> ${}
  const result = code.replace(regex, '${$1}')

  // 转换成为模板字符串`${a1} ${a2}`格式

  return `\`${result}\``
}
// 树结构根据id查找父级链
export const findParent = (tree: any[], id: string) => {
  const result: any[] = []
  const find = (tree: any[], id: string) => {
    for (let i = 0; i < tree.length; i++) {
      const item = tree[i]
      if (item.id === id) {
        result.push(item)
        return true
      }
      if (item.children && item.children.length > 0) {
        if (find(item.children, id)) {
          // 找到了，把父级添加进去
          result.push(item)
          return true
        }
      }
    }
    return false
  }
  find(tree, id)
  return result
}
// 示例
// const tree = [
//   {
//     id: '1',
//     children: [
//       {
//         id: '1-1',
//         children: [
//           {
//             id: '1-1-1',
//           },
//         ],
//       },
//       {
//         id: '1-2',
//       },
//     ],
//   },
//   {
//     id: '2',
//     children: [
//       {
//         id: '2-1',
//       },
//     ],
//   },
// ]
// console.log(findParent(tree, '1-1-1'))
// console.log(findParent(tree, '1-2'))

// 多维数组转一维数组
export const flatten = (arr: any[]): string | any[] => {
  return arr.reduce((prev, next) => {
    return prev.concat(Array.isArray(next) ? flatten(next) : next)
  }, [])
}

export function isEmptyObj(obj: any) {
  if (isObject(obj)) {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  }
  return false
}

// 首字母大写
export function capitalizeFirstLetter(str: string) {
  if (!str) {
    return ''
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// sleep函数
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
// 对象转字符串
export function objectToString(obj: { [x: string]: any }) {
  let str = '{'
  for (const key in obj) {
    if (typeof obj[key] === 'function') {
      str += `${key}: ${obj[key].toString()},`
    } else {
      // todo: 循环遍历
      str += `${key}: ${JSON.stringify(obj[key])},`
    }
  }
  str = str.slice(0, -1) + '}'
  return str
}

// 字符串转对象
export function stringToObject(str: string) {
  return eval(`(${str})`)
}
