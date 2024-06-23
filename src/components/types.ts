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
  x1: number
  x2: number
  y1: number
  y2: number
}

export type Lines = Record<string, Line>

interface BlockSettings {
  color: string
  icon: string
  text: string
}

export const getBlockSettings = (block: Block): BlockSettings => {
  switch (block.type) {
    case 'ConditionActionHandler':
      return {
        color: '#6585D6',
        icon: 'condition',
        text: 'ConditionActionHandler',
      }
    case 'ConsoleResultHandler':
      return {
        color: 'var(--color-primary-blue)',
        icon: 'squares',
        text: 'ConsoleResultHandler',
      }
    case 'DoubleOptInEmailActionHandler':
      return {
        color: '#2CBED0',
        icon: 'mail-double-opt-in',
        text: 'DoubleOptInEmailActionHandler',
      }
    case 'EmailActionHandler':
      return {
        color: '#FB9600',
        icon: 'mail',
        text: 'EmailActionHandler',
      }
    case 'EventActionHandler':
      return {
        color: '#7942EE',
        icon: 'add-tag',
        text: 'EventActionHandler',
      }
    case 'ExternalUrlActionHandler':
      return {
        color: '#6585D6',
        icon: 'setting',
        text: 'ExternalUrlActionHandler',
      }
    case 'ForwardEmailActionHandler':
      return {
        color: '#FFC500',
        icon: 'mail-redirect',
        text: 'ForwardEmailActionHandler',
      }
    case 'PointsActionHandler':
      return {
        color: '#8DBE00',
        icon: 'coins',
        text: 'PointsActionHandler',
      }
    case 'PointsExpireHandler':
      return {
        color: '#C4CC51',
        icon: 'coins',
        text: 'PointsExpireHandler',
      }
    case 'PushActionHandler':
      return {
        color: '#7E8BAA',
        icon: 'notification',
        text: 'PushActionHandler',
      }
    case 'ReferralEmailActionHandler':
      return {
        color: '#BA72C7',
        icon: 'mail-referral',
        text: 'ReferralEmailActionHandler',
      }
    case 'RemoveEventActionHandler':
      return {
        color: '#E25A50',
        icon: 'delete-tag',
        text: 'RemoveEventActionHandler',
      }
    case 'SMSActionHandler':
      return {
        color: '#21B657',
        icon: 'message',
        text: 'SMSActionHandler',
      }
    case 'SplitActionHandler':
      return {
        color: '#6585D6',
        icon: 'split',
        text: 'SplitActionHandler',
      }
    case 'StatusActionHandler':
      return {
        color: '#7084B6',
        icon: 'star',
        text: 'StatusActionHandler',
      }
    case 'WaitActionHandler':
      return {
        color: 'var(--color-primary-blue)',
        icon: 'clock',
        text: 'WaitActionHandler',
      }
  }
}
