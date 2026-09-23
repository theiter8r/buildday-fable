import { describe, expect, it } from 'vitest'
import { NODE_TYPES } from '@/domain/types'
import { nodeTypes } from '../nodeTypes'

describe('nodeTypes', () => {
  it('maps every NodeType to a component', () => {
    for (const type of NODE_TYPES) {
      expect(nodeTypes[type]).toBeTypeOf('function')
    }
  })

  it('covers exactly the five node types, no more no less', () => {
    expect(Object.keys(nodeTypes).sort()).toEqual([...NODE_TYPES].sort())
  })
})
