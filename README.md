
# RecipeBot

Demonstrate the core capabilities of the Microsoft Bot Framework

  

This bot has been created using [Microsoft Bot Framework][10]

  

# To run the bot

- Install modules and start the bot

```bash

npm i & npm start

```

Alternatively you can also use nodemon via

```bash

npm i & npm run watch

```

  

# Testing the bot using Bot Framework Emulator

[Microsoft Bot Framework Emulator][2] is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

  

- Install the Bot Framework emulator from [here][3]

  

## Connect to bot using Bot Framework Emulator **V4**

- Launch Bot Framework Emulator

- File -> Open Bot Configuration

- Select `RecipeBot.bot` file

  

# Bot Info

RecipeBot is a simple chat bot that users can interact with to search and save recipes based off input ingredients.

  

LUIS is used to predict users intent during an input and based of that intent the user will be sent.

Intents are preset.

* Greeting

* Search_Recipe

* Add_To_Search

* Modify_Search

* Set_Name

* Cancel

* Help

* None

  

If the intent is Greeting than the bot will guide them through prompts that will create a profile and search for a recipe. There are several checks through the waterfall dialog that will save user data and/or give prompts


Search_Recipe intent will initiate another waterfall dialog that will also check for user data, if there is no data than it will prompt the user to create a profile. If user already exists then it will immediately query the API with the entities that are collected using LUIS.


Whenever a recipe is searched, the bot will respond with three recipes in separate ActivityCards from the CardFactory in the botBuilder API. It will display information from each recipe and allow the user to click a link to view the source and a button to save the recipes (this is to be added later).

One of the main things that humans do better than bots is understand context. I created two intents to provide a pseudo understanding of context. MODIFY_SEARCH and ADD_TO_SEARCH for example if after a user searches a recipe and they say a phrase like "I ran out bacon" or "what about cheddar cheese" the bot will take the previous search and either add or remove items based off the new intent, add or remove. These intents have a check to make sure that the user has a previous search, if not the user will be directed to search a recipe first (this also needs to be improved). Implementing this took extra time because the LUIS recognition kept clashing with SEARCH_RECIPE. I had to create various phrase lists to help the bot discern the various different but similar intents.

  

# Troubleshooting

  

Before attending the Boot camp at General Assembly, I was teaching myself to code with zero experience I learn JavaScript, React, Node and HTML/CSS. Learning these technologies alone took a lot of Googling and troubleshooting without any assistance. I attended the Boot camp to experience an intensive learning environment and improve my portfolio. The Boot camp was challenging and forced me again to be able to learn on the fly and I again improved my troubleshooting abilities. I have a mental checklist that I go through when encountering problems, the checklist isn't set in stone. But I will always follow the data to make sure its coming in as expected, I will Google error messages or just "How do I ...". I will hard code variables or inputs to make sure that there isn't a problem with the implementation and later abstract the functionality once it is working as expected. 

  
## experience helping others
Because I had previous experience with JavaScript, React and Node when I began the Boot camp, I would constantly help my classmates. For example I helped my classmates understand ES6 Array methods when they were introduced by going through what each method does, the parameters and what it outputs. Even when we had projects or homework, I was frequently asked to help debug or explain an issue. I enjoy helping others because I love the challenge and it helps me understand concepts even deeper.

  

# TODO

* I have enjoyed building this bot and while continue to improve it
 
1) Go through Help dialog

2) Go through waterfall dialogs to DRY up code, refactor and rename steps.

3) Improve Dialog paths based off user intent.

4) Implement Recipe Save functionality.

5) Implement Saved Recipe Search functionality.

6) Deploy.

7) Tweak Prompts.

8) Learn more about LUIS to improve intent recognition. 

  

[2]:  https://github.com/microsoft/botframework-emulator

[3]:  https://aka.ms/botframework-emulator

[10]:  https://dev.botframework.com