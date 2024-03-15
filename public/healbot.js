document.addEventListener('DOMContentLoaded', function() {
    const output = document.getElementById('output');
    const inputField = document.querySelector('.input-container input');
    const submitButton = document.getElementById('submit');
    const history = document.querySelector('.history');
    const newChatButton = document.querySelector('button');

        //  for the submit button
    submitButton.addEventListener('click', function() {
        const message = inputField.value.trim();

        if (message !== '') {
            // to add user's message to the main section
            const userMessageElement = document.createElement('div');
            userMessageElement.textContent = message;
            userMessageElement.classList.add('message', 'user-message');
            output.appendChild(userMessageElement);
        

            // adding user's message to the chat history
            const userMessageHistoryElement = userMessageElement.cloneNode(true);
            history.appendChild(userMessageHistoryElement);

            // sending user's message to the server
            fetch('/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: [{ role: 'user', content: message }] })
            })
            .then(response => response.json())
            .then(data => {
                // Displaying the res of bot in the main section
                const botMessageElement = document.createElement('div');
                botMessageElement.textContent = data.response;
                botMessageElement.classList.add('message','bot-message');
                output.appendChild(botMessageElement);

            })
           

            inputField.value = ''; // used to clear input field
        }
    });

    // Event listener for the 'Enter' key
    inputField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            submitButton.click();
        }
    });

    // event listener for the 'New chat' button
    newChatButton.addEventListener('click', function() {
        // used to clear both main section and chat history
        output.innerHTML = '';
        history.innerHTML = '';
    });
});
