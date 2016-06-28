'use strict';

const fs = require('graceful-fs');

const tmpl = require('../../lib/tmpl');

const templates = {
  'register.html': fs.readFileSync(process.cwd() + '/web/templates/register.html').toString(),
  'account.html': fs.readFileSync(process.cwd() + '/web/templates/account.html').toString(),
  'overview.html': fs.readFileSync(process.cwd() + '/web/templates/overview.html').toString()
};

const error = code => {
  return {
    err: code
  };
};

const text = data => {
  return {
    mime: 'text/plain',
    data: data
  };
};

const json = data => {
  return {
    mime: 'application/json',
    data: JSON.stringify(data)
  };
};

const file = (data, mime) => {
  return {
    mime: mime,
    data: data
  };
};

const template = (name, model) => {
  const rendered = tmpl.render(templates[name], model || {});

  return {
    mime: 'text/html',
    data: rendered
  };
};

const redirect = url => {
  return {
    redirect: url
  };
};

module.exports = {
  error,
  text,
  json,
  file,
  template,
  redirect
};
