var queryEl = document.getElementById('query');
var resultsEl = document.getElementById('results');
var queryJp = document.getElementById('jpquery');
var resultsJp = document.getElementById('jpresults');

var evaluateQuery = function() {
    chrome.runtime.sendMessage({
        type: 'evaluate',
        query: queryEl.value
    });
};

queryEl.addEventListener('keyup', evaluateQuery);

var evaluateJpQuery = function() {
    chrome.runtime.sendMessage({
        type: 'evaluate_jsonpath',
        query: queryJp.value
    });
};

queryJp.addEventListener('keyup', evaluateJpQuery);

function handleRequest(request, sender, cb) {
    if(request.type === "evaluate-res"){
        resultsEl.value = request.res;
    }
    if(request.type === "evaluate-jsonpath-res"){
        resultsJp.value = request.res;
    }
}

chrome.runtime.onMessage.addListener(handleRequest);