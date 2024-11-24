"use client";

import { ActiveOrderChat } from "./ActiveOrderChat";
import { BiddingOrderChat } from "./BiddingOrderChat";

interface OrderChatProps {
  orderid: string;
  onClose: () => void;
  title?: string;
  chatType: 'active' | 'bidding';
}

const OrderChat = ({ orderid, onClose, title, chatType }: OrderChatProps) => {
  if (chatType === 'bidding') {
    return <BiddingOrderChat orderId={orderid} title={title || ''} onClose={onClose} />;
  }

  return <ActiveOrderChat orderId={orderid} onClose={onClose} />;
};

export default OrderChat;
