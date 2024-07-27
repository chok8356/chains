export interface Node {
  id: number
  inputId?: Node['id']
  outputIds: Set<Node['id']>
  x: number
  y: number
}

export interface Line {
  end: { id?: number; x: number; y: number }
  start: { id?: number; x: number; y: number }
}

export interface Block {
  id: number
  parentId?: Block['id']
  x: number
  y: number
}

export type Blocks = Record<Block['id'], Block>
