var queryEl = document.getElementById('query');
var resultsEl = document.getElementById('results');
var nodeCountEl = document.getElementById('node-count');

console.log("hello")
var evaluateQuery = function() {
    chrome.runtime.sendMessage({
        type: 'evaluate',
        query: queryEl.value
    });
};

queryEl.addEventListener('keyup', evaluateQuery);

function handleRequest(request, sender, cb) {
    if(request.type === "evaluate-res"){
        resultsEl.value = request.res;
    }
}
chrome.runtime.onMessage.addListener(handleRequest);