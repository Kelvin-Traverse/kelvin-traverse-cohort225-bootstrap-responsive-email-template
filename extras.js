for (let i = 0; i < 1; i++) {
    const message = new Message(i, 'Test Sender', 'Test subject', 'Test content.');
    messageList[i] = message;
}

messageList[1] = new Message(1, 'Marcus T. Cicero', 'Lorem Ipsum', 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quae facilis porro, iure neque vitae, officiis ad sint numquam nam, dignissimos iste aliquid optio sit suscipit enim repellendus provident modi labore.', {read: true});

for (const message of Object.values(messageList)) {
    document.getElementById('mailbox').appendChild(message.element);
}