var BTCChina = require('./btcchina.js');

var publicBtcchina = new BTCChina();

publicBtcchina.ticker('cnyltc',function(err,ret){
  console.log(ret);
});
// publicBtcchina.trades(console.log);
// publicBtcchina.historydata(5000, console.log);
// publicBtcchina.orderbook(console.log);

var key = 'd396f280-b4f8-4db9-8134-1e4bda0e2aba';
var secret = '7e170110-e450-45d1-9cb0-692a9c3b2514';

var privateBtcchina = new BTCChina(key, secret);

//    commented out for your protection

// privateBtcchina.buyOrder2(9000, 1, console.log);
// privateBtcchina.cancelOrder(1, console.log);
privateBtcchina.getAccountInfo(null,function(err,ret){
  console.log(ret);
});
// privateBtcchina.getDeposits('BTC', null, console.log);
// privateBtcchina.getMarketDepth2(null, console.log);
// privateBtcchina.getOrder(1, console.log);
// privateBtcchina.getOrders(true, console.log);
// privateBtcchina.getTransactions('all', 10, console.log);
// privateBtcchina.getWithdrawal(1, console.log);
// privateBtcchina.getWithdrawals('BTC', true, console.log); // `pendingonly` only works at true as of Sun Nov 24 15:56:07 CET 2013.
// privateBtcchina.requestWithdrawal('BTC', 1, console.log);
// privateBtcchina.sellOrder2(9000, 1, console.log);
