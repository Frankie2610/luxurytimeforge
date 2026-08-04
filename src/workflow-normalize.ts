import {asList} from './data-normalize';

export interface WorkflowEvent {
  id: string;
  orderId: string;
  type: 'note' | 'payment' | 'fulfillment' | 'return' | 'refund' | 'status';
  title: string;
  detail: string;
  createdAt: string;
  actor: string;
}

export interface FulfillmentRecord {
  id: string;
  orderId: string;
  lineIds: string[];
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  status: 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface RefundLine {lineId: string; quantity: number; amount: number}
export interface RefundRecord {id: string; orderId: string; lines: RefundLine[]; amount: number; reason: string; restocked: boolean; createdAt: string}
export interface ReturnRecord {id: string; orderId: string; lineIds: string[]; reason: string; status: 'requested' | 'approved' | 'received' | 'closed'; createdAt: string}
export interface WorkflowStore {events: WorkflowEvent[]; fulfillments: FulfillmentRecord[]; refunds: RefundRecord[]; returns: ReturnRecord[]}

export const emptyWorkflow = (): WorkflowStore => ({events: [], fulfillments: [], refunds: [], returns: []});

export const normalizeWorkflowStore = (value: unknown): WorkflowStore => {
  if (!value || typeof value !== 'object') return emptyWorkflow();
  const source = value as Partial<Record<keyof WorkflowStore, unknown>>;
  return {
    events: asList<WorkflowEvent>(source.events),
    fulfillments: asList<FulfillmentRecord>(source.fulfillments),
    refunds: asList<RefundRecord>(source.refunds),
    returns: asList<ReturnRecord>(source.returns),
  };
};
