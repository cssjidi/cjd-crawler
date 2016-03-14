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
    if (typeof options === 'object') {
        extend(params, options, {uri: url})
    } else if (typeof url === 'string') {
        extend(params, {url: url})
    } else {
        extend(params, url)
    }
    if(url === undefined){
        return false;
    }
    return params
}



var params = {}


params.callback = callback
return params
