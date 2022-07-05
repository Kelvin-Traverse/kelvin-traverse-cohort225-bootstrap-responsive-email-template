// Template class for easily creating clonable templates
class Template {
    constructor(templateHTML) {
        this.elem = document.createElement('template');
        this.elem.innerHTML = templateHTML;
    }

    clone(deepClone=true) {
        return this.elem.content.firstElementChild.cloneNode(deepClone);
    }
}

// Template of an email draft
const draftTemplate = new Template(`
<div class="draft">
    <label title="select message">
        <input type="checkbox">
    </label>
    <div class="message-info">
        <p><span>To:</span> <span class="recipients"></span></p>
        <p class="subject">b</p>
        <p class="contents">c</p>
    </div>
</div>
`);

// Template of an email message
const messageTemplate = new Template(`
<div class="message unread">
    <label title="select message">
        <input type="checkbox">
    </label>
    <div class="message-info">
        <p class="sender">a</p>
        <p class="subject">b</p>
        <p class="contents">c</p>
    </div>
</div>
`);

// Template for a mailbox
const mailboxTemplate = new Template(`
<div class="mailbox hidden"></div>
`);


class MailboxManager {
    constructor(mailboxContainer) {
        this.elem = mailboxContainer;
        this.mailboxes = {};
        this.currentMailbox = null;
    }

    addMailbox(mailbox) {
        this.currentMailbox = mailbox;
        this.mailboxes[mailbox.id] = mailbox;
        this.elem.appendChild(mailbox.elem);
    }

    showMailbox(id) {
        if (this.currentMailbox) {
            this.currentMailbox.hide();
        }
        this.currentMailbox = this.mailboxes[id];
        this.currentMailbox.show();
    }

    showMessages(mailboxId, filter, searchString) {
        if (mailboxId === undefined) {
            mailboxId = this.currentMailbox.id;
        }

        this.mailboxes[mailboxId].showMessages(filter, searchString);
        this.showMailbox(mailboxId);
    }

    moveMessage(message, newMailbox) {
        delete message.currentMailbox.messages[message.id];
        message.elem.querySelector('input').checked = false;
        if (newMailbox !== undefined){
            newMailbox.addMessage(message);
        }
    }

    moveMessages(messages, newMailbox) {
        for (const message of messages) {
            this.moveMessage(message, newMailbox);
        }
    }
}


class Mailbox {
    constructor(id, viewElementSelector, viewFunction=null) {
        this.elem = mailboxTemplate.clone();
        this.id = id;
        this.messages = {};
        this.viewSelector = viewElementSelector
        this.viewFunction = viewFunction;

        this.filter = '';
        this.searchString = '';
    }

    addMessage(message) {
        this.messages[message.id] = message;
        message.currentMailbox = this;
        for (const elem of message.elem.querySelectorAll(this.viewSelector)) {
            elem.addEventListener('click', event => {
                this.viewFunction(message)
            });
        }
    }

    showMessages(filter, searchString) {
        this.filter = filter === undefined ? this.filter : filter;
        this.searchString = searchString === undefined ? this.searchString : searchString;

        this.elem.innerHTML = '';
        const messages = [];

        for (const key in this.messages) {
            const message = this.messages[key];

            if (this.filter === 'unread' && !message.unread) {
                continue;
            } else if (this.filter === 'important' && !message.important) {
                continue
            } else if (this.searchString !== '' && !message.includes(this.searchString)) {
                continue
            }
            messages.unshift(message);
        }

        for (const message of messages) {
            this.elem.appendChild(message.elem);
        }
    }

    hide() {
        this.elem.classList.add('hidden');
    }

    show() {
        this.elem.classList.remove('hidden');
    }
}


class Message {
    constructor(id, sender, subject, contents, unread=true, important=false) {
        const elem = messageTemplate.clone();

        elem.setAttribute('data-id', id);

        elem.querySelector('.sender').textContent = sender;
        elem.querySelector('.subject').textContent = subject;
        elem.querySelector('.contents').textContent = contents;

        this.elem = elem;
        this.id = id;
        this.sender = sender;
        this.subject = subject;
        this.contents = contents;

        this.unread = unread;
        this.important = important;

        if (!unread) {
            this.markAsRead();
        }
    }

    markAsRead() {
        this.unread = false;
        this.elem.classList.remove('unread')
    }

    markAsUnread() {
        this.unread = true;
        this.elem.classList.add('unread')
    }

    includes(string) {
        const str = string.toLowerCase();
        if (this.subject.toLowerCase().includes(str) || this.contents.toLowerCase().includes(str)) {
            return true;
        }
        return false;
    }
}


class Draft {
    constructor(id, recipients, subject, contents) {
        const elem = draftTemplate.clone();

        elem.setAttribute('data-id', id);

        elem.querySelector('.recipients').textContent = recipients.join(' ');
        elem.querySelector('.subject').textContent = subject;
        elem.querySelector('.contents').textContent = contents;

        this.elem = elem;
        this.id = id;
        this.recipients = recipients;
        this.subject = subject;
        this.contents = contents;
    }

    includes(string) {
        const str = string.toLowerCase();
        if (this.subject.toLowerCase().includes(str) || this.contents.toLowerCase().includes(str)) {
            return true;
        }
        return false;
    }
}

// WARNING: Code beyond this point is experimental and is likely bug-ridden
// Code above this point probably has some bugs too.

window.addEventListener('load', event => {
    let currentViewedMessage = null;

    const offcanvasViewElem = document.getElementById('view-column');
    const offcanvasView = new bootstrap.Offcanvas(offcanvasViewElem);

    const modalComposeElem = document.getElementById('compose');
    const modalCompose = new bootstrap.Modal(modalComposeElem);

    const fillOffcanvasView = message => {
        offcanvasViewElem.querySelector('.sender').innerText = message.sender;
        offcanvasViewElem.querySelector('.subject').innerText = message.subject;
        offcanvasViewElem.querySelector('.contents').innerText = message.contents;
        offcanvasViewElem.classList.remove('empty');
        if (window.innerWidth < 992) {
            offcanvasView.show();
        }
        currentViewedMessage = message;
        console.log(currentViewedMessage.currentMailbox.id);
        message.markAsRead();
    };

    const fillModalCompose = draft => {
        modalComposeElem.querySelector('#compose-to').value = draft.recipients;
        modalComposeElem.querySelector('#compose-subject').value = draft.subject;
        modalComposeElem.querySelector('#compose-contents').value = draft.contents;
        modalComposeElem.setAttribute('data-draft-id', draft.id);
        modalCompose.show();
    };

    const clearModalCompose = () => {
        modalComposeElem.querySelector('#compose-to').value = '';
        modalComposeElem.querySelector('#compose-subject').value = '';
        modalComposeElem.querySelector('#compose-contents').value = '';
        modalComposeElem.removeAttribute('data-draft-id');
    };

    modalComposeElem.addEventListener('hidden.bs.modal', clearModalCompose);

    const mailboxRowElem = document.getElementById('mailbox-row');
    const mailboxManager = new MailboxManager(mailboxRowElem);

    const inbox = new Mailbox('inbox', '.message-info', message => fillOffcanvasView(message));
    const sent = new Mailbox('sent', '.message-info', message => fillOffcanvasView(message));
    const drafts = new Mailbox('drafts', '.message-info', draft => fillModalCompose(draft));
    const trash = new Mailbox('trash', '.message-info', message => fillOffcanvasView(message));

    mailboxManager.addMailbox(inbox);
    mailboxManager.addMailbox(sent);
    mailboxManager.addMailbox(drafts);
    mailboxManager.addMailbox(trash);

    //inbox.addMessage(new Message('0', 'Joe', 'None', 'Contents\ncontents'));
    //sent.addMessage(new Message('x', 'To: Joe', 'None', 'Contents\ncontents', false));
    //drafts.addMessage(new Draft('1', ['Shmoe'], 'None', 'Contents\ncontents'));
    trash.addMessage(new Message('secret', 'Kelvin', 'Secret Message', "Shhh...\nDon't tell anyone that I'm here. It's a secret."));

    // functions for handling 'move to inbox' button in the trash mailbox
    const moveToInboxElem = offcanvasViewElem.querySelector('#view-move-to-inbox');

    const showMoveToInbox = () => {
        moveToInboxElem.classList.remove('hidden');
    };

    const hideMoveToInbox = () => {
        moveToInboxElem.classList.add('hidden');
    };

    

    // Functions for dealing with multiple selected messages
    const getMultiselectElements = () => {
        const elements = [];
        for (const element of mailboxRowElem.querySelectorAll('.mailbox:not(.hidden) .message')) {
            if (element.querySelector('input:checked')) {
                elements.push(element)
            }
        }
        return elements;
    };

    const getMultiselectMessages = () => {
        return getMultiselectElements().map(elem => {
            const id = elem.getAttribute('data-id');
            return mailboxManager.currentMailbox.messages[id];
        });
    };

    const isMultiselect = () => {
        if (getMultiselectElements().length === 0) {
            return false;
        }
        return true;
    };

    const showMultiselectButton = () => {
        if (isMultiselect()) {
            mailboxRowElem.classList.add('multiselect');
        } else {
            mailboxRowElem.classList.remove('multiselect');
        }
    }

    mailboxRowElem.addEventListener('change', event => {
        showMultiselectButton();
    });

    // Handle actions for multiple selected items
    document.getElementById('multiselect-delete').addEventListener('click', event => {
        const elements = getMultiselectElements();
        if (mailboxManager.currentMailbox === trash) {
            for (const message of getMultiselectMessages()) {
                delete mailboxManager.currentMailbox.messages[message.id];
            }
        } else {
            mailboxManager.moveMessages(getMultiselectMessages(), trash)
        }
        
        for (const element of elements) {
            element.remove();
        }
        showMultiselectButton();
    })

    document.getElementById('multiselect-mark-unread').addEventListener('click', event => {
        for (const message of getMultiselectMessages()) {
            message.markAsUnread();
        }
        showMultiselectButton();
    })

    document.getElementById('multiselect-mark-important').addEventListener('click', event => {
        for (const message of getMultiselectMessages()) {
            message.important = true;
        }
        showMultiselectButton();
    })

    // handle mailbox switching
    const mailboxHeaderElem = document.getElementById('mailbox-header');

    for (const id of ['inbox', 'sent', 'drafts', 'trash']) {
        document.getElementById('btn-' + id).addEventListener('click', event => {
            mailboxHeaderElem.textContent = id;
            mailboxManager.showMessages(id, '', '');
            searchboxElem.value = '';
            offcanvasViewElem.classList.add('empty');
            if (id === 'trash') {
                showMoveToInbox();
            } else {
                hideMoveToInbox();
            }
        });
    }

    // handle searchbox actions
    const searchboxElem = document.getElementById('searchbox');

    searchboxElem.addEventListener('keydown', event => {
        if (event.code === 'Enter') {
            mailboxManager.showMessages(undefined, '', event.target.value);
        }
    })

    searchboxElem.addEventListener('keyup', event => {
        if (event.target.value === '') {
            mailboxManager.showMessages(undefined, '', '');
        }
    })

    searchboxElem.addEventListener('focus', event => {
        event.target.select();
    })

    // handle message actions
    document.getElementById('view-delete').addEventListener('click', event => {
        if (mailboxManager.currentMailbox === trash) {
            delete mailboxManager.currentMailbox.messages[currentViewedMessage.id];
        } else {
            mailboxManager.moveMessage(currentViewedMessage, trash);
        }
        mailboxManager.currentMailbox.elem.querySelector(`div[data-id="${currentViewedMessage.id}"]`).remove();
        currentViewedMessage = null;
        offcanvasViewElem.classList.add('empty');
        offcanvasView.hide();
        showMultiselectButton();
    });

    moveToInboxElem.addEventListener('click', event => {
        mailboxManager.moveMessage(currentViewedMessage, inbox);
        mailboxManager.currentMailbox.elem.querySelector(`div[data-id="${currentViewedMessage.id}"]`).remove();
        currentViewedMessage = null;
        offcanvasViewElem.classList.add('empty');
        offcanvasView.hide();
        showMultiselectButton();
    });

    document.getElementById('view-mark-unread').addEventListener('click', event => {
        currentViewedMessage.markAsUnread();
    });

    document.getElementById('view-flag').addEventListener('click', event => {
        currentViewedMessage.important = !currentViewedMessage.important;
    });

    // handle the filter
    document.getElementById('filter-all').addEventListener('click', event => {
        mailboxManager.showMessages(undefined, '', undefined);
    });

    document.getElementById('filter-unread').addEventListener('click', event => {
        mailboxManager.showMessages(undefined, 'unread', undefined);
    });

    document.getElementById('filter-important').addEventListener('click', event => {
        mailboxManager.showMessages(undefined, 'important', undefined);
    });

    const generateRandomId = (digits=32) => {
        return Array(digits).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    // handle email composition and sending (VERY EXPERIMENTAL)
    document.getElementById('compose-close').addEventListener('click', event => {
        const recipientsString = document.getElementById('compose-to').value;
        const recipients = recipientsString.split(' ');
        const noRecipients = recipientsString === '' ? true : false;

        const subject = document.getElementById('compose-subject').value;
        const contents = document.getElementById('compose-contents').value;
        
        if (noRecipients && subject === '' && contents === '') {
            return;
        }
        let id = modalComposeElem.getAttribute('data-draft-id');
        if (!id) {
            id = generateRandomId();
        }
        drafts.addMessage(new Draft(id, recipients, subject, contents));
        if (mailboxManager.currentMailbox === drafts) {
            mailboxManager.showMessages('drafts');
        }
    });

    document.getElementById('compose-dispose').addEventListener('click', event => {
        const id = modalComposeElem.getAttribute('data-draft-id');
        if (id) {
            delete mailboxManager.mailboxes['drafts'].messages[id];
        }
        if (mailboxManager.currentMailbox === drafts) {
            mailboxManager.showMessages('drafts');
        }
    });

    document.getElementById('compose-send').addEventListener('click', event => {
        const recipientsString = document.getElementById('compose-to').value;
        const recipients = recipientsString.split(' ');
        const noRecipients = recipientsString === '' ? true : false;

        if (noRecipients) {
            return;
        }
        const subject = document.getElementById('compose-subject').value;
        const contents = document.getElementById('compose-contents').value;
        let id = modalComposeElem.getAttribute('data-draft-id');
        if (id) {
            delete mailboxManager.mailboxes['drafts'].messages[id];
        } else {
            id = generateRandomId();
        }
        sent.addMessage(new Message(id, 'To: ' + recipients.join(', '), subject, contents, false));
        if (mailboxManager.currentMailbox === drafts) {
            mailboxManager.showMessages('drafts');
        }
    });

    // fun stuff

    const anonSender = generateRandomId(16) + '@www.anonymousemails.net'
    inbox.addMessage(new Message(
        generateRandomId(),
        anonSender,
        'Strange people in Reed Park',
        `I couldn't sleep last night and decide to take a walk around the neighborhood to clear my mind (I know about the curfew, that's why I'm using a throwaway email address). As I approached Reed Park, I noticed a group of people dressed in black standing around something on the ground. I left immediately and went back home. I returned to the park this morning, to where I thought the group was standing, but I couldn't find any evidence of what they had been doing.\n\nAny ideas what this could be?`
    ));

    inbox.addMessage(new Message(
        generateRandomId(),
        'HOA Board of Directors',
        'Pest Control Specialists in Reed Park',
        `Dear Residents of Peaceful Meadows,\n\nOver the past week or so, we have received reports of a group of raccoons causing disturbances in the community. Last night, a team of pest control specialists was called in to deal with the issue. The raccoons were caught in Reed Park and have been relocated outside of the area. We apologize for any alarm that the presence of the pest control specialists may have caused, as we failed to notify you to their coming. Moving forward, we will attempt to keep everyone better informed of what is going on in our community.\n\nSincerely,\n\nPeaceful Meadows Homeowners' Association Board of Directors`
    ));

    inbox.addMessage(new Message(
        generateRandomId(),
        'Gary Owens',
        'Raccoons?',
        `I haven't heard anything about raccoons around here. Have you?`
    ));

    inbox.addMessage(new Message(
        generateRandomId(),
        anonSender,
        'Is there a cult in Peaceful Meadows?',
        `Those people didn't look like pest control specialists to me, and now I know they weren't. I returned to Reed Park last night, and there they were again, dressed in their black outfits. I got closer this time, staying hidden behind some bushes, and could just make out a continuous, low chanting before I lost my nerve and left.\n\nHas anyone else noticed anything strange around the neighborhood?`
    ));

    inbox.addMessage(new Message(
        generateRandomId(),
        'HOA Board of Directors',
        'Rumors in the Community',
        `Dear Residents of Peaceful Meadows,\n\nIt has come to our attention that someone in our community has been spreading rumors of a group of cultists conducting strange rituals in Reed Park around midnight. We can assure you that these rumors are false. Furthermore, we must stress that when you agreed to the Rules and Regulations of Peaceful Meadows, you agreed to a strict 11:00pm curfew. Your compliance with this curfew is greatly appreciated, as it helps maintain the safety and security of all residents of Peaceful Meadows.\n\nSincerely,\n\nPeaceful Meadows Homeowners' Association Board of Directors`
    ));

    inbox.addMessage(new Message(
        generateRandomId(),
        'Rosie McCann',
        'Board of Directors',
        `Have we ever had a vote for the Board of Directors? I've lived here for 10 years now and I can't recall ever having a vote. I might bring it up at the next meeting.`
    ));

    inbox.addMessage(new Message(
        generateRandomId(),
        anonSender,
        `I don't know what to do`,
        `I wish I just stayed home.\n\nI don't know why, but I went back to the park. I managed to get even closer than before. They were standing in a circle, and there were candles in every space between them. As they chanted, I felt the ground rumble. Suddenly, in the middle of their circle, the dirt heaved and something like a giant worm rose out of the ground. Its slimy, black surface glistened in the flickering candle light. I panicked and, in my haste to escape from what I had just witnessed, overturned a trash can which crashed to the ground. I didn't stop to see if they heard. I just ran.\n\nI'm scared and I don't know what to do.`
    ));

    inbox.addMessage(new Message(
        generateRandomId(),
        'HOA Board of Directors',
        'Reed Park Closed for Maintenance',
        `Dear Residents of Peaceful Meadows,\n\nLast night around midnight, a pipe running under Reed Park burst, creating a deep hole in the ground. Accordingly, the park will be closed for a few days while the pipe is being repaired and the hole filled in. We apologize for any inconvenience this might cause and ask that, for your own safety, you do not attempt to enter the park while it is closed.\n\nSincerely,\n\nPeaceful Meadows Homeowners' Association Board of Directors`
    ));

    inbox.addMessage(new Message(
        generateRandomId(),
        anonSender,
        '[Blank]',
        `They're right outside my door.`
    ));

    mailboxManager.showMessages('inbox');
});