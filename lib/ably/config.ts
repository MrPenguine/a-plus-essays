const Ably = require('ably');

const ably = new Ably.Realtime(process.env.NEXT_PUBLIC_ABLY_API_KEY);
ably.connection.once('connected', () => {
  console.log('Connected to Ably!');
});
// close connection function
const closeConnection = () => {
  ably.close();
};

export default ably;