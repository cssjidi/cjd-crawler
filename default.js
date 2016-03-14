var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var extend = require('extend');
var mkdirp = require('mkdirp');
var async = require('async');
var urlUtil = require('url');
var iconv = require('iconv-lite');
var path = require('path');


var Spider = function(url,options){
    if (typeof options === 'function') {
        return false;
    }
    this.config = {};
    this.hrefLinks = [];
    this.imgLinks = [];
    if (typeof options === 'object') {
        extend(config, options, {uri: url})
    } else if (typeof url === 'string') {
        extend(config, {url: url})
    } else {
        extend(config, url)
    }
    if(url === undefined){
        return false;
    }
}
//处理入口
Spider.prototype.init = function(){

}
//处理第一层的链接(分页)
Spider.prototype.urls = function(){
    var url = this.config.url || '';
    var list = this.config.listPage || '';
    var i = this.config.from || 1;
    var to = this.config.to || 1;
    for(;i<to;i++){
        hrefLinks.push();
    }
}
