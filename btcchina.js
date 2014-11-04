var querystring = require("querystring");
var https = require('https');
var http = require('http');
var _ = require('underscore');
var crypto = require('crypto');

var BTCChina = function(key, secret) {
  this.key = key;
  this.secret = secret;

  _.bindAll(this);
}

// internal method for making a REST call
BTCChina.prototype._request = function(handler, options, data, callback) {
  var req = handler.request(options, function(res) {
    res.setEncoding('utf8');
    var buffer = '';
    res.on('data', function(data) {
      buffer += data;
    });
    res.on('end', function() {

      // check and return unauthorized messages
      if(buffer.lastIndexOf('401 Unauthorized', 0) === 0)
        return callback('General API error: '+buffer);
      else if(buffer === 'HTTP 403 Forbidden')
        return callback('403 Forbidden to access method');

      try {
        var json = JSON.parse(buffer);
      } catch (err) {
        return callback(err);
      }

      if('error' in json)
        return callback('API error: ' + json.error.message + ' (code ' + json.error.code + ')');

      callback(null, json);
    });
  });
  req.on('error', function(err) {
    callback(err);
  });
  req.end(data);
}

// internal method for accessing the Market API
// 
// http://btcchina.org/api-market-data-documentation-en
BTCChina.prototype._marketRequest = function(method, params, callback) {
  var options = {
    host: 'data.btcchina.com',
    path: '/data/' + method + '/?' + querystring.stringify(params),
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; BTCchina node.js client)'
    }
  };

  this._request(https, options, null, callback);
}


// 
// Market API calls
// 
BTCChina.prototype.ticker = function(market, callback) {
  var params = {};

  if(market)
    params['market']=market;

  this._marketRequest('ticker', params, callback);
}

BTCChina.prototype.trades = function(callback) {
  this._marketRequest('trades', null, callback);
}

BTCChina.prototype.historydata = function(limit, since, sincetype, callback) {
  var params = {};

  if(limit)
    params['limit']=limit;

  if(since)
    params['since']=since;

  if(sincetype)
    params['sincetype']=sincetype;

  this._marketRequest('historydata', params, callback);
}

BTCChina.prototype.orderbook = function(market, limit, callback) {
  var params = {};

  if(market)
    params['market']=market;

  if(limit)
    params['limit']=limit

  this._marketRequest('orderbook', params, callback);
}

// internal method for accessing the Trade API
// 
// http://btcchina.org/api-trade-documentation-en
BTCChina.prototype._tradeRequest = function(method, params, callback) {
  if(!this.key || !this.secret)
    throw 'Must provide key and secret to make Trade API requests';

  if(!_.isArray(params))
    throw 'Params need to be an array with parameters in the order they are listed in the API docs.';

  if(!_.isFunction(callback))
    callback = function() {};

  var tonce = new Date() * 1000; // spoof microsecond
  var args = {
    tonce: tonce,
    accesskey: this.key,
    requestmethod: 'post',
    id: 1,
    method: method,
    params: params.join('~') // we need commas here in the querystring
                              // hacky workaround to perserve them
  };
  var qs = querystring.stringify(args).replace(/~/g, ',');

  var signer = crypto.createHmac('sha1', this.secret);
  var hmac = signer.update(qs).digest('hex');
  var signature = new Buffer(this.key + ':' + hmac).toString('base64');

  var body = JSON.stringify({
    method: args.method,
    params: params,
    id: args.id
  }, null, 4);

  var options = {
    host: 'api.btcchina.com',
    path: '/api_trade_v1.php',
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; BTCchina node.js client)',
      'Content-Length': body.length,
      'Authorization': 'Basic ' + signature,
      'Json-Rpc-Tonce': tonce
    }
  };

  this._request(https, options, body, callback);
}

// 
// Trade API calls
// 

BTCChina.prototype.buyOrder = function(price, amount, callback) {
   throw 'This method is deprecated. Please use buyOrder2.';
}

BTCChina.prototype.buyOrder2 = function(price, amount, market, callback) {
  if(market === null || market === undefined)
    this._tradeRequest('buyOrder2', [price, amount], callback);
  else
    this._tradeRequest('buyOrder2', [price, amount], market, callback);

}

BTCChina.prototype.cancelOrder = function(id, market, callback) {
  if(market === null || market === undefined)
    this._tradeRequest('cancelOrder', [id], callback);
  else
    this._tradeRequest('cancelOrder', [id, market], callback);
}

BTCChina.prototype.getAccountInfo = function(type, callback) {
  if(type === null || type === undefined)
    this._tradeRequest('getAccountInfo', [], callback);
  else
    this._tradeRequest('getAccountInfo', [type], callback);
}

BTCChina.prototype.getDeposits = function(currency, pendingonly, callback) {
  if(pendingonly === null || pendingonly === undefined)
    // default is true
    this._tradeRequest('getDeposits', [currency], callback);
  else
    this._tradeRequest('getDeposits', [currency, pendingonly], callback);
}

BTCChina.prototype.getMarketDepth = function() {
  throw 'This method is deprecated. Please use getMarketDepth2.';
}

BTCChina.prototype.getMarketDepth2 = function(limit, market, callback) {
  if(limit === null || limit === undefined)
    limit = 10;

  if(market === null || market === undefined)
    market='BTCCNY';

  this._tradeRequest('getMarketDepth2', [limit, market], callback);
}

BTCChina.prototype.getOrder = function(id, market, withdetail, callback) {
  if(market === null || market === undefined)
    market='BTCCNY';

  if(withdetail === null || withdetail === undefined)
    withdetail=false;

  this._tradeRequest('getOrder', [id, market, withdetail], callback);
}

BTCChina.prototype.getOrders = function(openonly, market, limit, offset, since, withdetail, callback) {
  if(openonly === null || openonly === undefined)
    openonly=true;

  if(market === null || market === undefined)
    market='BTCCNY';

  if(limit === null || limit === undefined)
    limit=1000;

  if(offset === null || offset === undefined)
    offset=0;

  if(since === null || since === undefined)
    since=0;

  if(withdetail === null || withdetail === undefined)
    withdetail=false;

  this._tradeRequest('getOrders', [openonly, market, limit, offset, since, withdetail], callback);
}

BTCChina.prototype.getTransactions = function(type, limit, offset, since, sincetype, callback) {
  if(type === null || type === undefined)
    type = 'all';

  if(limit === null || limit === undefined)
    limit = 10;

  if(offset === null || offset === undefined)
    offset = 0;

  if(since === null || since === undefined)
    since = 0;

  if(sincetype === null || sincetype === undefined)
    sincetype = 'time';

  this._tradeRequest('getTransactions', [type, limit, offset, since, sincetype], callback);
}

BTCChina.prototype.getWithdrawal = function(id, currency, callback) {
  if(currency === null || currency === undefined)
    currency = 'BTC';

  this._tradeRequest('getWithdrawal', [id, currency], callback);
}

BTCChina.prototype.getWithdrawals = function(currency, pendingonly, callback) {
  if(pendingonly === false)
    this._tradeRequest('getWithdrawals', [currency, pendingonly], callback);
  else
    this._tradeRequest('getWithdrawals', [currency], callback);
}

BTCChina.prototype.requestWithdrawal = function(currency, amount, callback) {
  this._tradeRequest('requestWithdrawal', [currency, amount], callback);
}

BTCChina.prototype.sellOrder = function(currency, amount, callback) {
  throw 'This method is deprecated. Please use sellOrder2.';
}

BTCChina.prototype.sellOrder2 = function(currency, amount, market, callback) {
  if(market === null || market === undefined)
    this._tradeRequest('sellOrder2', [currency, amount], callback);
  else
    this._tradeRequest('sellOrder2', [currency, amount], market, callback);
}

module.exports = BTCChina;
