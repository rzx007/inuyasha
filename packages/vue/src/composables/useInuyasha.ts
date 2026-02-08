import { inject } from 'vue'
import { INUYASHA_KEY, type InuyashaInstance } from '../sdk'

export function useInuyasha(): InuyashaInstance {
  const instance = inject(INUYASHA_KEY)
  if (!instance) {
    throw new Error(
      'Inuyasha not initialized. Make sure to call createInuyasha() or use createInuyashaPlugin.'
    )
  }
  return instance
}

export function useEditor() {
  const { stores } = useInuyasha()
  return stores.editor
}

export function useComponentMeta() {
  const { stores } = useInuyasha()
  return stores.componentMeta
}

export function useComponentInstance() {
  const { stores } = useInuyasha()
  return stores.componentInstance
}

export function useDataSource() {
  const { stores } = useInuyasha()
  return stores.dataSource
}

export function useFormState() {
  const { stores } = useInuyasha()
  return stores.formState
}
