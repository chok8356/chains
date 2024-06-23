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

export const enum SceneEntityType {
  Block,
}

export interface Line {
  from: {
    x: number
    y: number
  }
  to: {
    x: number
    y: number
  }
}

export type Lines = Record<string, Line>
