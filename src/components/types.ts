export interface Node {
  id: number
  inputId: Node['id'] | undefined
  outputIds: Set<Node['id']>
  x: number
  y: number
}

export interface Line {
  end: {
    id: number | undefined
    x: number
    y: number
  }
  start: {
    id: number | undefined
    x: number
    y: number
  }
}

export interface Block {
  id: number
  parentId: Block['id'] | undefined
  x: number
  y: number
}

export type Blocks = Record<Block['id'], Block>
