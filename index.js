const offcanvasView = new bootstrap.Offcanvas(document.getElementById('view-column'));

const viewSender = document.getElementById('view-sender');
const viewSubject = document.getElementById('view-subject');
const viewContent = document.getElementById('view-content');

const messageTemplate = document.getElementById('message-template');

class Message {
    constructor(id, sender, subject, content, options={}) {
        this.id = id;
        this.sender = sender;
        this.subject = subject;
        this.content = content;
        this.read = options.read | false;

        const messageDiv = messageTemplate.content.firstElementChild.cloneNode(true);
        messageDiv.setAttribute('data-message-id', id);
        
        const senderLine = messageDiv.getElementsByClassName('sender')[0];
        const subjectLine = messageDiv.getElementsByClassName('subject')[0];
        const contentLine = messageDiv.getElementsByClassName('content')[0];

        senderLine.innerHTML = sender;
        subjectLine.innerHTML = subject;
        contentLine.innerHTML = content;

        if (this.read) {
            messageDiv.classList.add('read');
        }

        this.element = messageDiv;
    }

    markAsRead() {
        this.element.classList.add('read');
    }

    markAsUnread() {
        this.element.classList.remove('read');
    }
}

const messageList = {};

document.getElementById('mailbox').addEventListener('click', (e) => {
    if (e.target.classList.contains('message-info')) {
        document.getElementById('view').classList.remove('empty');
        const parent = e.target.parentElement;
        const id = parent.getAttribute('data-message-id');
        const message = messageList[id];
        message.markAsRead();
        console.log(message);
        viewSender.innerHTML = message.sender;
        viewSubject.innerHTML = message.subject;
        viewContent.innerHTML = message.content;
        if ( window.innerWidth <= 992) {
            offcanvasView.show();
        }
    }
});