import { ref } from 'vue'
import { testEndpoint } from '@/api/data-service'
import type { ApiRequest, ApiResponse, Header, Param } from '../types'

export function useApiRequest() {
  const response = ref<ApiResponse | null>(null)
  const isLoading = ref(false)

  // 构建请求头
  const prepareHeaders = (requestHeaders: Header[]) => {
    const headers = new Headers()
    requestHeaders
      .filter((header) => header.enabled)
      .forEach((header) => {
        headers.append(header.name, header.value)
      })
    return headers
  }

  // 构建查询参数
  const prepareQueryParams = (queryParams: Param[], url: string) => {
    if (!queryParams || queryParams.length === 0) {
      return url
    }

    const enabledParams = queryParams.filter((param) => param.enabled)
    if (enabledParams.length === 0) {
      return url
    }

    const urlObj = new URL(url)
    enabledParams.forEach((param) => {
      if (param.name && param.value) {
        urlObj.searchParams.append(param.name, param.value)
      }
    })

    return urlObj.toString()
  }

  // 构建请求体
  const prepareBody = (method: string, body: string) => {
    if (method !== 'GET' && method !== 'HEAD' && body) {
      return body
    }
    return undefined
  }

  // 提取响应头
  const extractResponseHeaders = (fetchResponse: Response) => {
    const responseHeaders: Record<string, string> = {}
    fetchResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    return responseHeaders
  }

  // 创建API响应对象
  const createApiResponse = (
    fetchResponse: Response,
    responseText: string,
    responseSize: number,
    startTime: number,
  ): ApiResponse => {
    return {
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers: extractResponseHeaders(fetchResponse),
      body: responseText,
      time: Date.now() - startTime,
      size: responseSize,
    }
  }

  // 创建错误响应对象
  const createErrorResponse = (error: unknown, startTime: number): ApiResponse => {
    return {
      status: 500,
      statusText: '请求失败',
      headers: {},
      body: JSON.stringify({ error: error instanceof Error ? error.message : '未知错误' }, null, 2),
      time: Date.now() - startTime,
      size: 0,
    }
  }

  // 构建参数对象
  const prepareArguments = (request: ApiRequest) => {
    // 如果 params 存在，优先使用 params
    if (request.params && request.params.length > 0) {
      const enabledParams = request.params.filter((param) => param.enabled)
      const paramsObj: Record<string, any> = {}
      enabledParams.forEach((param) => {
        if (param.name && param.value) {
          // 尝试解析 JSON 值，如果失败则使用原始字符串
          try {
            paramsObj[param.name] = JSON.parse(param.value)
          } catch {
            paramsObj[param.name] = param.value
          }
        }
      })
      return paramsObj
    }

    // 如果只有 body，使用 body
    if (request.body) {
      try {
        return JSON.parse(request.body)
      } catch {
        return {}
      }
    }

    return {}
  }

  // 发送请求
  const sendRequest = async (request: ApiRequest) => {
    isLoading.value = true
    const startTime = Date.now()

    try {
      // const headers = prepareHeaders(request.headers)
      // const body = prepareBody(request.method, request.body)
      // const url = prepareQueryParams(request.params, request.url)
      const argumentsObj = prepareArguments(request)

      // 发送请求
      const fetchResponse = await testEndpoint({
        serverName: '默认mcp服务',
        toolName: request.toolName,
        arguments: argumentsObj,
      })

      // 获取响应体
      const responseText = await fetchResponse.json()
      const responseDataString = JSON.stringify(responseText?.data?.text || {})
      const responseSize = new Blob([responseDataString]).size

      // 构建API响应对象
      response.value = createApiResponse(fetchResponse, responseDataString, responseSize, startTime)
    } catch (error) {
      console.log('🚀 ~ sendRequest ~ error:', error)
      // 处理错误情况
      response.value = createErrorResponse(error, startTime)
    } finally {
      isLoading.value = false
    }
  }

  return {
    response,
    isLoading,
    sendRequest,
  }
}
