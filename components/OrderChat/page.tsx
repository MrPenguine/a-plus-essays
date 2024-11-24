"use client";

import { ActiveOrderChat } from "./ActiveOrderChat";
import { BiddingOrderChat } from "./BiddingOrderChat";
import { OrderChatProps } from './BiddingOrderChat';

const OrderChat: React.FC<OrderChatProps> = ({
  orderid,
  onClose,
  tutorid,
  tutorname,
  profile_pic,
  chatType,
  title
}) => {
  if (chatType === 'bidding') {
    return <BiddingOrderChat orderId={orderid} title={title || ''} onClose={onClose} />;
  }

  return <ActiveOrderChat orderId={orderid} onClose={onClose} />;
};

export default OrderChat;
