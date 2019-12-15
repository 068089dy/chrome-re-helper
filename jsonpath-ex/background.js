// 数据转发
function handleRequest(request, sender, cb) {
    // Simply relay the request. This lets content.js talk to bar.js.
    chrome.tabs.sendMessage(sender.tab.id, request, cb);
}
chrome.runtime.onMessage.addListener(handleRequest);

// 点击action图表，显示/隐藏bar
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, {greeting: "hello"});
});


