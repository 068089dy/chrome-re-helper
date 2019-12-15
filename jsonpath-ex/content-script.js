// var html;
// document.addEventListener("DOMContentLoaded", function(event) { 
//     html = document.body.innerHTML;
// });

'use strict';

// const script = document.createElement('script');
// script.setAttribute("type", "module");
// script.setAttribute("src", chrome.extension.getURL('jsonpath.js'));
// const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
// head.insertBefore(script, head.lastChild);

// import jsonPath from './jsonpath.js';

var reRes = '';

chrome.runtime.onMessage.addListener(function (request, sender, cb) {
    if (request.greeting === "hello") {
        if (document.getElementById("jp-ifr") == null) {
            var ifr = document.createElement('iframe');
            ifr.src = chrome.runtime.getURL('bar.html');
            ifr.id = 'jp-ifr';
            document.body.appendChild(ifr)
        } else {
            var ifr = document.getElementById("jp-ifr");
            if (ifr.classList.contains('hidden')) {
                ifr.classList.remove('hidden');
            } else {
                ifr.classList.add('hidden');
            }
        }
    }
    if (request.type === "evaluate") {
        var re = new RegExp(request.query, 'g');
        var html = document.body.innerHTML;
        reRes = re.exec(html);
        chrome.runtime.sendMessage({
            type: 'evaluate-res',
            res: reRes[1]
        });
    }
    if (request.type === "evaluate_jsonpath") {
        if (JSON.parse(reRes[1]) != null){
            chrome.runtime.sendMessage({
                type: 'evaluate-jsonpath-res',
                res: jsonPath(JSON.parse(reRes[1]), request.query)
            });
        }
        
        // if(reRes[1] != null && reRes[1] != ''){
        //     console.log(request.query);
        // }
    }
});

function jsonPath(obj, expr, arg) {
    var P = {
        resultType: arg && arg.resultType || 'VALUE',
        result: [],
        normalize: function (expr) {
            var subX = [];
            return expr.replace(/[\['](\??\(.*?\))[\]']/g, function ($0, $1) {
                return '[#' + (subX.push($1) - 1) + ']';
            }).replace(/'?\.'?|\['?/g, ';').replace(/;;;|;;/g, ';..;').replace(/;$|'?]|'$/g, '').replace(/#([0-9]+)/g, function ($0, $1) {
                return subX[$1];
            });
        },
        asPath: function (path) {
            var x = path.split(';'), p = '$';
            for (var i = 1, n = x.length; i < n; i++)
                p += /^[0-9*]+$/.test(x[i]) ? '[' + x[i] + ']' : '[\'' + x[i] + '\']';
            return p;
        },
        store: function (p, v) {
            if (p)
                P.result[P.result.length] = P.resultType == 'PATH' ? P.asPath(p) : v;
            return !!p;
        },
        trace: function (expr, val, path) {
            if (expr) {
                var x = expr.split(';'), loc = x.shift();
                x = x.join(';');
                if (val && val.hasOwnProperty(loc))
                    P.trace(x, val[loc], path + ';' + loc);
                else if (loc === '*')
                    P.walk(loc, x, val, path, function (m, l, x, v, p) {
                        P.trace(m + ';' + x, v, p);
                    });
                else if (loc === '..') {
                    P.trace(x, val, path);
                    P.walk(loc, x, val, path, function (m, l, x, v, p) {
                        typeof v[m] === 'object' && P.trace('..;' + x, v[m], p + ';' + m);
                    });
                } else if (/,/.test(loc)) {
                    // [name1,name2,...]
                    for (var s = loc.split(/'?,'?/), i = 0, n = s.length; i < n; i++)
                        P.trace(s[i] + ';' + x, val, path);
                } else if (/^\(.*?\)$/.test(loc))
                    // [(expr)]
                    P.trace(P.eval(loc, val, path.substr(path.lastIndexOf(';') + 1)) + ';' + x, val, path);
                else if (/^\?\(.*?\)$/.test(loc))
                    // [?(expr)]
                    P.walk(loc, x, val, path, function (m, l, x, v, p) {
                        if (P.eval(l.replace(/^\?\((.*?)\)$/, '$1'), v[m], m))
                            P.trace(m + ';' + x, v, p);
                    });
                else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc))
                    // [start:end:step]  phyton slice syntax
                    P.slice(loc, x, val, path);
            } else
                P.store(path, val);
        },
        walk: function (loc, expr, val, path, f) {
            if (val instanceof Array) {
                for (var i = 0, n = val.length; i < n; i++)
                    if (i in val)
                        f(i, loc, expr, val, path);
            } else if (typeof val === 'object') {
                for (var m in val)
                    if (val.hasOwnProperty(m))
                        f(m, loc, expr, val, path);
            }
        },
        slice: function (loc, expr, val, path) {
            if (val instanceof Array) {
                var len = val.length, start = 0, end = len, step = 1;
                loc.replace(/^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g, function ($0, $1, $2, $3) {
                    start = parseInt($1 || start);
                    end = parseInt($2 || end);
                    step = parseInt($3 || step);
                });
                start = start < 0 ? Math.max(0, start + len) : Math.min(len, start);
                end = end < 0 ? Math.max(0, end + len) : Math.min(len, end);
                for (var i = start; i < end; i += step)
                    P.trace(i + ';' + expr, val, path);
            }
        },
        eval: function (x, _v) {
            try {
                return $ && _v && eval(x.replace(/@/g, '_v'));
            } catch (e) {
                throw new SyntaxError('jsonPath: ' + e.message + ': ' + x.replace(/@/g, '_v').replace(/\^/g, '_a'));
            }
        }
    };
    var $ = obj;
    if (expr && obj && (P.resultType == 'VALUE' || P.resultType == 'PATH')) {
        P.trace(P.normalize(expr).replace(/^\$;/, ''), obj, '$');
        return P.result.length ? P.result : false;
    }
}