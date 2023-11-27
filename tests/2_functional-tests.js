const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('GET /api/stock-prices => stockdata object', function() {
    
    test('1 stock', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'goog');
          assert.isNotNull(res.body.stockData.price);
          assert.isNotNull(res.body.stockData.likes);
          done();
        });
    });

    test('1 stock with like', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'goog');
          assert.equal(res.body.stockData.likes, 1);
          done();
        });
    });

    test('1 stock with like again (ensure likes arent double counted)', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body, 'Error: Only 1 Like per IP Allowed');
          done();
        });
    });

    test('2 stocks', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['aapl', 'msft']})
        .end(function(err, res){
          assert.isArray(res.body.stockData);
          if(res.body.stockData[0].stock === 'aapl'){
            assert.equal(res.body.stockData[0].stock, 'aapl');
            assert.equal(res.body.stockData[0].rel_likes, 0);
            assert.equal(res.body.stockData[0].likes, 0);
            assert.equal(res.body.stockData[1].stock, 'msft');
            assert.equal(res.body.stockData[1].rel_likes, 0);
            assert.equal(res.body.stockData[1].likes, 0);
          }else{
            assert.equal(res.body.stockData[1].stock, 'aapl');
            assert.equal(res.body.stockData[1].rel_likes, 0);
            assert.equal(res.body.stockData[1].likes, 0);
            assert.equal(res.body.stockData[0].stock, 'msft');
            assert.equal(res.body.stockData[0].rel_likes, 0);
            assert.equal(res.body.stockData[0].likes, 0);
          }
          done();
        })
    });
    
    test('2 stocks with like', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['ibm', 'amzn'], like: true})
        .end(function(err, res){
          if(res.body.stockData[0].stock === 'ibm'){
            assert.equal(res.body.stockData[0].stock, 'ibm');
            assert.equal(res.body.stockData[0].rel_likes, 0);
            assert.equal(res.body.stockData[0].likes, 1);
            assert.equal(res.body.stockData[1].stock, 'amzn');
            assert.equal(res.body.stockData[1].rel_likes, 0);
            assert.equal(res.body.stockData[1].likes, 1);
           }else{
            assert.equal(res.body.stockData[1].stock, 'ibm');
            assert.equal(res.body.stockData[1].rel_likes, 0);
            assert.equal(res.body.stockData[1].likes, 1);     
            assert.equal(res.body.stockData[0].stock, 'amzn');
            assert.equal(res.body.stockData[0].rel_likes, 0);  
            assert.equal(res.body.stockData[0].likes, 1);  
           }
          done();
        });
    });
  });
});
