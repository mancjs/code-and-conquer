var fs = require('graceful-fs');
var tmpl = require('../../lib/tmpl');

var templates = {
  'register.html': fs.readFileSync(process.cwd() + '/web/templates/register.html').toString(),
  'account.html': fs.readFileSync(process.cwd() + '/web/templates/account.html').toString(),
  'overview.html': fs.readFileSync(process.cwd() + '/web/templates/overview.html').toString()
};

var error = function(code) {
  return {
    err: code
  };
};

var text = function(data) {
  return {
    mime: 'text/plain',
    data: data
  };
};

var json = function(data) {
  return {
    mime: 'application/json',
    data: JSON.stringify(data)
  };
};

var file = function(data, mime) {
  return {
    mime: mime,
    data: data
  };
};

var template = function(name, model) {
  var rendered = tmpl.render(templates[name], model || {});

  return {
    mime: 'text/html',
    data: rendered
  };
};

var redirect = function(url) {
  return {
    redirect: url
  };
};

module.exports = {
  error: error,
  text: text,
  json: json,
  file: file,
  template: template,
  redirect: redirect
};