// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const LUIS_CONFIGURATION = 'Starter_Key';
const { ChoicePrompt, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { UserProfile } = require('./dialogs/greeting/UserProfile');
const { GreetingDialog } = require('./dialogs/greeting');
const { RecipeSearchDialog } = require('./dialogs/recipeSearch')
//dialog cards
const IntroCard = require('./resources/IntroCard.json')
const WELCOMED_USER = 'welcomedUserProperty';

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'userProfileProperty';

// Greeting Dialog ID
const GREETING_DIALOG = 'greetingDialog';
const RECIPE_SEARCH_DIALOG = 'recipeSearch';

// Supported LUIS Intents.
const SEARCH_RECIPE = 'Search_Recipe'
const GREETING_INTENT = 'Greeting';
const CANCEL_INTENT = 'Cancel';
const HELP_INTENT = 'Help';
const NONE_INTENT = 'None';

// Supported LUIS Entities, defined in ./dialogs/greeting/resources/greeting.lu
const USER_NAME_ENTITIES = ['userName', 'userName_patternAny'];
const USER_LOCATION_ENTITIES = ['userLocation', 'userLocation_patternAny'];

class MyBot {
  /**
   *
   * @param {ConversationState} conversation state object
   */
  constructor(conversationState, userState, botConfig) {
    if (!conversationState) throw new Error('Missing parameter.  conversationState is required');
    if (!userState) throw new Error('Missing parameter.  userState is required');
    if (!botConfig) throw new Error('Missing parameter.  botConfig is required');

    // LUIS recognizer
    const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION)
    if (!luisConfig || !luisConfig.appId) throw new Error('Missing LUIS configs')
    this.luisRecognizer = new LuisRecognizer({
      applicationId: luisConfig.appId,
      endpoint: luisConfig.getEndpoint(),
      endpointKey: luisConfig.authoringKey
    })

    // Creates a new state accessor property.
    // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.


    // Create the property accessors for user and conversation state
    this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
    this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

    // Create top-level dialog(s)
    this.dialogs = new DialogSet(this.dialogState);
    // Add the Greeting dialog to the set
    this.dialogs.add(new GreetingDialog(GREETING_DIALOG, this.userProfileAccessor));
    // this.dialogs.add(new RecipeSearchDialog(RECIPE_SEARCH_DIALOG, this.userProfileAccessor));
    // this.dialogs.add(new ChoicePrompt(RECIPE_SEACH_DIALOG))

    this.conversationState = conversationState;
    this.userState = userState;


    this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);
  }
  /**
   *
   * @param {TurnContext} on turn context object.
   */
  async onTurn(turnContext) {
    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    if (turnContext.activity.type === ActivityTypes.Message) {
      let dialogResult;

      // Create a dialog context
      const dc = await this.dialogs.createContext(turnContext);

      const results = await this.luisRecognizer.recognize(turnContext);
      const topIntent = LuisRecognizer.topIntent(results)

      // I think this is necessary in case something gets paused for whatever reason
      dialogResult = await dc.continueDialog();

      // If no active dialog or no active dialog has responded,
      if (!dc.context.responded) {
        // Switch on return results from any active dialog.
        switch (dialogResult.status) {
          // dc.continueDialog() returns DialogTurnStatus.empty if there are no active dialogs
          case DialogTurnStatus.empty:
            // Determine what we should do based on the top intent from LUIS.
            switch (topIntent) {
              case SEARCH_RECIPE:
                await this.dialogs.add(new RecipeSearchDialog(RECIPE_SEARCH_DIALOG, this.userProfileAccessor, results.entities.keyPhrase));
                await dc.beginDialog(RECIPE_SEARCH_DIALOG);
                break;
              case GREETING_INTENT:
                console.log('status', DialogTurnStatus.empty)
                await dc.beginDialog(GREETING_DIALOG);
                break;
              case NONE_INTENT:
              default:
                // None or no intent identified, either way, let's provide some help
                // to the user
                await dc.context.sendActivity(`I didn't understand what you just said to me.`);
                break;
            }
            break;
          case DialogTurnStatus.waiting:
            // The active dialog is waiting for a response from the user, so do nothing.
            break;
          case DialogTurnStatus.complete:
            // All child dialogs have ended. so do nothing.
            break;
          default:
            // Unrecognized status from child dialog. Cancel all dialogs.
            await dc.cancelAllDialogs();
            break;
        }
      }

    }
    else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
      // Send greeting when users are added to the conversation.
      await this.sendWelcomeMessage(turnContext);
    }
    else {
      await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
    }
    // Save state changes
    await this.conversationState.saveChanges(turnContext);
    await this.userState.saveChanges(turnContext);
  }
  /**
     * Sends welcome messages to conversation members when they join the conversation.
     * Messages are only sent to conversation members who aren't the bot.
     * @param {TurnContext} turnContext
     */
  async sendWelcomeMessage(turnContext) {
    // Do we have any new members added to the conversation?
    if (turnContext.activity.membersAdded.length !== 0) {
      // Iterate over all new members added to the conversation
      for (let idx in turnContext.activity.membersAdded) {
        // Greet anyone that was not the target (recipient) of this message.
        // Since the bot is the recipient for events from the channel,
        // context.activity.membersAdded === context.activity.recipient.Id indicates the
        // bot was added to the conversation, and the opposite indicates this is a user.
        if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
          turnContext.sendActivity({
            attachments: [CardFactory.adaptiveCard(IntroCard)]
          });
        }
      }
    }
  }
  /**
     * Helper function to update user profile with entities returned by LUIS.
     *
     * @param {LuisResults} luisResults - LUIS recognizer results
     * @param {DialogContext} dc - dialog context
     */
  async updateUserProfile(luisResult, context) {
    console.log(luisResult.entities.personName)
    // Do we have any entities?
    if (Object.keys(luisResult.entities).length !== 1) {
      // get userProfile object using the accessor
      let userProfile = await this.userProfileAccessor.get(context);
      if (userProfile === undefined) {
        userProfile = new UserProfile();
      }
      // see if we have any user name entities
      if (luisResult.entities.personName !== undefined) {
        console.log('exists')
        userProfile.name = luisResult.entities.personName[0]
      }
      // set the new values
      await this.userProfileAccessor.set(context, userProfile);
      console.log('current user', userProfile)
    }
  }
}

module.exports.MyBot = MyBot;