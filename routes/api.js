'use strict';

const expect = require('chai').expect
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

module.exports = function (app) {

  mongoose.connect(process.env.URL);

  const stockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    likes: { type: Number, default: 0 },
    ips: [String]
  });

  const Stock = mongoose.model('Stock', stockSchema);

  app.route('/api/stock-prices')
    .get(async (req, res)=> {
      let responseObject = {};
      responseObject['stockData'] = {};
      

      let twoStocks = false;

      let outputResponse = () => {
        return res.json(responseObject);    
      }

      let findOrUpdateStock = await (async function(stockName, documentUpdate, nextStep) {
        
        let stockDocument = await Stock.findOneAndUpdate(
          {name: stockName},
          documentUpdate,
          {new: true, upsert: true}
        );

        try{
          if(stockDocument){
            if(twoStocks ===false){
              return nextStep(stockDocument, processOneStock);
          }else{
              return nextStep(stockDocument, processTwoStocks);
          }
          }
        }catch(err){
          console.log(err);
        }
      })
    

      let likeStock = await (async function(stockName, nextStep){
        let stockDocument = await Stock.findOne({name: stockName});
        try{
          if(stockDocument && stockDocument['ips'] && stockDocument['ips'].includes(req.ip)){
            return res.json('Error: Only 1 Like per IP Allowed')
          }else{
            let documentUpdate = {$inc: {likes: 1}, $push: {ips: req.ip}};
            nextStep(stockName, documentUpdate, getPrice)
          }
        }catch(err){
          console.log(err);
        }
      })

      let getPrice = (stockDocument, nextStep) => {
        let xhr = new XMLHttpRequest()
        let requestUrl = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + stockDocument['name'] + '/quote'   
        xhr.open('GET', requestUrl, true)
        xhr.onload = () => {
          let response = JSON.parse(xhr.responseText)
          stockDocument['price'] = response['latestPrice']
          nextStep(stockDocument,outputResponse)
        }
        xhr.send()
      }

      let processOneStock = (stockDocument, nextStep) => {
        responseObject['stockData']['stock'] = stockDocument['name']
        responseObject['stockData']['price'] = stockDocument['price']
        responseObject['stockData']['likes'] = stockDocument['likes']
        nextStep()
      }
      
      let stocks = []

      let processTwoStocks = (stockDocument, nextStep) => {
        let newStock = {}
        newStock['stock'] = stockDocument['name']
        newStock['price'] = stockDocument['price']
        newStock['likes'] = stockDocument['likes']
        stocks.push(newStock)
        if(stocks.length === 2){
          stocks[0]['rel_likes'] = stocks[0]['likes'] - stocks[1]['likes']
          stocks[1]['rel_likes'] = stocks[1]['likes'] - stocks[0]['likes']
          responseObject['stockData'] = stocks
          nextStep()
        }else{
          return
        }
      }  
      
      if(typeof (req.query.stock) === 'string') {
        let stockName = req.query.stock;

        let documentUpdate = {}
        if(req.query.like && req.query.like === 'true'){
            likeStock(stockName, findOrUpdateStock)
        }else{
          findOrUpdateStock(stockName, documentUpdate, getPrice)
        }
        
      
      } else if (Array.isArray(req.query.stock)) {
        twoStocks = true
        let stockName = req.query.stock[0];
        if(req.query.like && req.query.like === 'true'){
          likeStock(stockName, findOrUpdateStock)
        }else{
          let documentUpdate = {}
          findOrUpdateStock(stockName, documentUpdate, getPrice)
        }
        stockName = req.query.stock[1];
        if(req.query.like && req.query.like === 'true'){
            likeStock(stockName, findOrUpdateStock)
        }else{
            let documentUpdate = {}
            findOrUpdateStock(stockName, documentUpdate, getPrice)
        }
    }; 
  });
}