#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "test.html";
var CHECKSFILE_DEFAULT = "checks-test-1.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var buildfn = function(url, checks) {
  var verifyUrl = function(result, response) {
    if (result instanceof Error) {
      console.log("Url %s does not exist. Exiting.", url);
    } else {
      var outJson = checkHtmlFile(result, checks);
      console.log(outJson);
    }
  };

  return verifyUrl;
};

var checkUrl = function(url, checks) {
  var verify = buildfn(url, checks);
  rest.get(url).on('complete', verify);
};

var cheerioHtmlFile = function(html) {
  return cheerio.load(html);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(html, checksfile) {
    $ = cheerioHtmlFile(html);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <html_url>', 'Url to index.html')
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);
    
    if (program.url) {
      checkUrl(program.url, program.checks);
    } else {
      var checkJson = checkHtmlFile(fs.readFileSync(program.file), program.checks);
      var outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
    }
    
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
