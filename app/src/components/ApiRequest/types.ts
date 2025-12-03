export interface Header {
  id: string
  name: string
  value: string
  enabled: boolean
}

export interface Param {
  id: string
  name: string
  value: string
  enabled: boolean
}

export interface FormData {
  id: string
  name: string
  value: string
  enabled: boolean
}

export interface ApiRequest {
  toolName: string
  method: string
  url: string
  headers: Header[]
  params: Param[]
  body: string
  bodyType: 'json' | 'form' | 'raw' | 'none'
  formData?: FormData[]
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
}

export interface DataSource {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'mongodb' | 'redis'
  status: 'connected' | 'disconnected'
}

export interface RequestInfo {
  index: number
  name: string
  value: string
  text: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
}
export interface ServiceDefinition {
  name: string
  requestType: string
  serviceVersion: string
  protocol: 'http' | 'https'
  serviceName: string
  definition: string
  dbId: string[]
  requestInfo?: RequestInfo[]
  serviceDesc: string
}

export interface ServiceDefinitionParams extends Omit<ServiceDefinition, 'dbId'> {
  id?: string
  dbId: string
  projectId: string
  autoPage: '1'
  responseType: 'json' | 'xml' | 'text' | 'html' | 'binary' | 'stream'
}

export interface ServiceResponse extends Omit<ServiceDefinition, 'dbId'> {
  dbId: string
  apiInfo: string | null
}
