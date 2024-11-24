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
    return <BiddingOrderChat orderid={orderid} title={title || ''} onClose={onClose} />;
  }

  return <ActiveOrderChat orderid={orderid} onClose={onClose} />;
};

export default OrderChat;
