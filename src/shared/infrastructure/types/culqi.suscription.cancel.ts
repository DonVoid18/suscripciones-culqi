export interface DataSuscriptionCancel {
  message: Message;
  action: string;
}

export interface Message {
  object: Object;
}

export interface Object {
  subsId: string;
  planId: string;
  merchantId: string;
}
