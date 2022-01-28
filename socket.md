# SOCKET IO DOCUMENTATION

## CHAT

- **EVENTS**
    - **message:** 

        ***Receive:***

        ``` 
        {
        "conversationId":"123",
        "content":"hello"
        "senderId":"123"
        }
        ```
        ***Send:***
        ```
        {
        "content": "7",
        "conversation": {
            "id": "310fffb0-d595-48e1-90d5-f302a4f8e64b",
            "created_at": "2022-01-26T05:05:19.883Z",
            "updated_at": "2022-01-26T05:05:19.883Z"
        },
        "sender": {
            "id": "f9285895-e8dc-446a-b5ba-c4209baf2fea",
            "username": "123",
            "profilePicture": "http://placeimg.com/640/480"
        },
        "id": "eb094526-9055-409a-993d-ff2d49913770"
        }
        ```
    - **join:**

        ***Receive:***
        ```
        {
            "conversationId":"123
        }
        ```
    
