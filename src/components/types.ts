export type BlockType =
  | 'ConditionActionHandler'
  | 'ConsoleResultHandler'
  | 'DoubleOptInEmailActionHandler'
  | 'EmailActionHandler'
  | 'EventActionHandler'
  | 'ExternalUrlActionHandler'
  | 'ForwardEmailActionHandler'
  | 'PointsActionHandler'
  | 'PointsExpireHandler'
  | 'PushActionHandler'
  | 'ReferralEmailActionHandler'
  | 'RemoveEventActionHandler'
  | 'SMSActionHandler'
  | 'SplitActionHandler'
  | 'StatusActionHandler'
  | 'WaitActionHandler'

export interface Block {
  id: number
  parentId: Block['id'] | null
  type: BlockType
  x: number
  y: number
}

export type Blocks = Record<Block['id'], Block>

export const enum SceneBlockType {
  Block,
}

export const enum SceneEventType {
  Input,
  Output,
}

export interface Line {
  x1: number
  x2: number
  y1: number
  y2: number
}

export type Lines = Record<string, Line>
