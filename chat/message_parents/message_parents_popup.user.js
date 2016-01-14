// ==UserScript==
// @name Reply to a chat message using only keyboard
// @description Allows user to select parent message for a particular user with keyboard only
// @version 0.1
// @namespace http://meta.stackexchange.com/q/272908
// @match *://chat.stackexchange.com/rooms/*
// @match *://chat.stackoverflow.com/rooms/*
// @match *://chat.meta.stackexchange.com/rooms/*
// @author soon
// @run-at document-end
// ==/UserScript==


var getUserNameFromContainer = function(c) { 
    return normalizeUserName(c.querySelector(".username").textContent); 
}

var getUserMessages = function(username) { 
    var prefix = username[0] == '@' ? '@' : ''; 
    return $("div.monologue").filter(function (i, c) { 
        return (prefix + getUserNameFromContainer(c)) == normalizeUserName(username); 
    }); 
}

var getMessagesFromContainer = function(c) { 
    return $.map($(c).find(".message"), function(m) {
        return {
            pid: m.id.split('-')[1],
            content: m.querySelector('.content').textContent}; 
        }); 
}

var getUserNameFromNewMessage = function() { 
    var message = document.getElementById('input').value;
    var username = /^\s*\@([\wа-яё]+)/i.exec(message);
    return username != null ? username[1] : null;
}

var convertMessageToHtml = function (m) { 
    return '<div class="message" id="_message-' + m.pid + '">' + 
               '<div class="content">' + m.content + '</div></div>'; 
}

var createParentMessagesPopupHtml = function(username) {
    return '<div class="popup" id="parent-messages-popup" ' +
                'style="left: 100px; bottom: 100px; width:60%;">' + 
                    Array.from(getUserMessages(username).map(function (i, c) { 
                        return getMessagesFromContainer(c); 
                    }).map(function(i, m) { 
                        return convertMessageToHtml(m); 
                    })).join('') + 
           '</div>';
}

var getParentMessagesPopup = function() {
    return $("#parent-messages-popup");
}

var isParentMessagesPopupOpen = function() {
    return getParentMessagesPopup().size() > 0;
}

var closeParentMessagesPopup = function() {
    getParentMessagesPopup().remove();
}

var openParentMessagesPopup = function(username) {
    if(isParentMessagesPopupOpen()) {
        closeParentMessagesPopup();
    }

    $('body').append(createParentMessagesPopupHtml(username));
    getParentMessagesPopup().find(".message").last().addClass("reply-parent");
}

var moveParentMessageSelectionUp = function() {
    getParentMessagesPopup().find(".reply-parent").prev().addClass("reply-parent").next().removeClass("reply-parent");
} 

var moveParentMessageSelectionDown = function() {
    getParentMessagesPopup().find(".reply-parent").next().addClass("reply-parent").prev().removeClass("reply-parent");
} 

var getIdOfSelectedParentMessage = function() {
    return getParentMessagesPopup().find(".reply-parent")[0].id.split('-')[1];
}

var replaceUserNameWithSelectedParentMessageAndClosePopup = function() {
    var input = document.getElementById('input');
    var parentId = getIdOfSelectedParentMessage();
    input.value = input.value.replace(/^\s*(\@[\wа-яё]+)/i, ":" + parentId);
    closeParentMessagesPopup();
}

document.getElementById('input').addEventListener('keydown', function (e) {
    if(!isParentMessagesPopupOpen()) {
        if(e.keyIdentifier == 'U+0020' && e.ctrlKey) { 
            var username = getUserNameFromNewMessage();
            if(username != null) {
                openParentMessagesPopup(username);
            }
        }
    } else {
        if(e.keyIdentifier == 'Up') {
            moveParentMessageSelectionUp();
            event.preventDefault();
            return false;
        } else if(e.keyIdentifier == 'Down') {
            moveParentMessageSelectionDown();
            event.preventDefault();
            return false;
        } else if(["Enter", "U+0009"].indexOf(e.keyIdentifier) >= 0) {
            replaceUserNameWithSelectedParentMessageAndClosePopup();
            event.preventDefault();
            return false;
        } else if (e.keyIdentifier == "U+001B") {
            closeParentMessagesPopup();
            event.preventDefault();
            return false;
        }
    }
}, false);
