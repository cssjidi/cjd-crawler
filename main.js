var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var url = require('url');
var fs = require('fs');
var async = require('async');


//config
var config = {
	baseUrl : 'http://u15.info',
	page:'page/%d',
	from:1,
	to:10,
	saveDir:'D:\www\spider'
}

var spider = function(){
	this.urls = [];
}

spider.prototype = {
	//程序入口
	crawler: function(){
		//this.listUrl();
		//console.log(this.urls);
		var self = this;
		this.listUrl(function(urls){
			self.getList(urls);
		});
		
	},
	//获取列表的数据
	getList :function(urls){
		async.eachSeries(urls,function(item,callback){
			console.log(item);
		})
	},
	//列表页
	listUrl: function(callback){
		var from = config.from || 1;
		var to = config.to || 10;
		var i = from;
		while(i < to){
			i++;
			var page = config.page.replace('%d',i);
			this.urls.push(page);
		}
		callback(this.urls);
	},
	//爬取的url
	request:function(url,callback){
		request(url,function(error,res,body){
			if(!error && res.statusCode === 200){
				var $ = cheerio.load(body);
				callback($);
			}
		})
	}
}

var cjd = new spider();
cjd.crawler();
