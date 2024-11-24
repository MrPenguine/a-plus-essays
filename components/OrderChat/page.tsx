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
    return <BiddingOrderChat 
      orderid={orderid} 
      title={title || ''} 
      onClose={onClose}
      tutorid={tutorid}
      tutorname={tutorname}
      chatType={chatType}
      profile_pic={profile_pic}
    />;
  }

  return <ActiveOrderChat orderid={orderid} onClose={onClose} />;
};

export default OrderChat;
