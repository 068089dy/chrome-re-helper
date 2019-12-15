var html;
document.addEventListener("DOMContentLoaded", function(event) { 
    html = document.body.innerHTML;
});

chrome.runtime.onMessage.addListener(function(request, sender, cb) {
    if (request.greeting === "hello") {
        if(document.getElementById("rh-123") == null){
            var ifr = document.createElement('iframe');
            ifr.src = chrome.runtime.getURL('bar.html');
            ifr.id = 'rh-123';
            document.body.appendChild(ifr)
        }else{
            var ifr = document.getElementById("rh-123");
            if(ifr.classList.contains('hidden')){
                ifr.classList.remove('hidden');
            }else{
                ifr.classList.add('hidden');
            }
        }
    }
    if (request.type === "evaluate") {
        var re = new RegExp(request.query, 'g');
        var html = document.body.innerHTML;
        var res = re.exec(html);
        chrome.runtime.sendMessage({
            type: 'evaluate-res',
            res: res[1]
        });

    }
});

