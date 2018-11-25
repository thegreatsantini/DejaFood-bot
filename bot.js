// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const LUIS_CONFIGURATION = 'Starter_Key';
const { ChoicePrompt, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { UserProfile } = require('./dialogs/UserProfile');
const { GreetingDialog } = require('./dialogs/greeting');
const { RecipeSearchDialog } = require('./dialogs/recipeSearch');
const { HelpDialog } = require('./dialogs/help');
//dialog cards
const IntroCard = require('./resources/IntroCard.json');
const WELCOMED_USER = 'welcomedUserProperty';

// State Accessor Properties
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'userProfileProperty';

// Dialog IDs
const GREETING_DIALOG = 'greetingDialog';
const RECIPE_SEARCH_DIALOG = 'recipeSearch';
const HELP_DIALOG = 'helpDialog';

// Supported LUIS Intents.
const SEARCH_RECIPE = 'Search_Recipe';
const ADD_TO_SEARCH_INTENT = 'Add_To_Search';
const REMOVE_FROM_SEARCH_INTENT = 'Remove_From_Search';
const GREETING_INTENT = 'Greeting';
const SET_NAME = 'Set_Name';
const CANCEL_INTENT = 'Cancel';
const HELP_INTENT = 'Help';
const NONE_INTENT = 'None';


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
    const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
    if (!luisConfig || !luisConfig.appId) throw new Error('Missing LUIS configs')
    this.luisRecognizer = new LuisRecognizer({
      applicationId: luisConfig.appId,
      endpoint: luisConfig.getEndpoint(),
      endpointKey: luisConfig.authoringKey
    });

    // Creates a new state accessor property.
    // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.


    // Create the property accessors for user and conversation state
    this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
    this.dialogState = conversationState.createProperty(DIALOG_STATE_PROPERTY);

    // Create top-level dialog(s)
    this.dialogs = new DialogSet(this.dialogState);
    // Add the Greeting dialog to the set
    this.dialogs.add(new GreetingDialog(GREETING_DIALOG, this.userProfileAccessor));
    this.dialogs.add(new RecipeSearchDialog(RECIPE_SEARCH_DIALOG, this.userProfileAccessor));
    this.dialogs.add(new HelpDialog(HELP_DIALOG, this.userProfileAccessor));
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

      // Make sure I dont need this
      // dialogResult = await dc.continueDialog();
      // add this in later as needed
      await this.updateSearch(results, turnContext);

      const interrupted = await this.isTurnInterrupted(dc, results);
      if (interrupted) {
        if (dc.activeDialog !== undefined) {
          // issue a re-prompt on the active dialog
          dialogResult = await dc.repromptDialog();
        } // Else: We dont have an active dialog so nothing to continue here.
      } else {
        // No interruption. Continue any active dialogs.
        dialogResult = await dc.continueDialog();
      }
      // check intents in case search needs modifing 
      const user = await this.userProfileAccessor.get(turnContext);
      console.log(topIntent)
      if (topIntent === ADD_TO_SEARCH_INTENT || topIntent === REMOVE_FROM_SEARCH_INTENT) {
        let prevSearch = user.search;
        switch (topIntent) {
          case ADD_TO_SEARCH_INTENT:
            // add items to previous search array and remove duplicates
            user.search = prevSearch.concat(results.entities.keyPhrase).filter((item, i, arr) => arr.indexOf(i) !== item);
            break;
          case REMOVE_FROM_SEARCH_INTENT:
            // remove items from previous search  
            user.search = prevSearch.filter(item => !results.entities.keyPhrase.includes(item));
            break;
          default:
            // None or no intent identified, either way, let's provide some help
            // to the user
            await dc.context.sendActivity(`I didn't understand what you just said to me.`);
            break;
        }
        // save changes to user
        await this.userProfileAccessor.set(turnContext, user);
      }

      // If no active dialog or no active dialog has responded,
      if (!dc.context.responded) {
        // Switch on return results from any active dialog.
        switch (dialogResult.status) {
          // dc.continueDialog() returns DialogTurnStatus.empty if there are no active dialogs
          case DialogTurnStatus.empty:
            // Determine what we should do based on the top intent from LUIS.
            switch (topIntent) {
              case SEARCH_RECIPE:
                user.search = results.entities.keyPhrase;
                await this.userProfileAccessor.set(turnContext, user);
                await dc.beginDialog(RECIPE_SEARCH_DIALOG);
                break;
              case GREETING_INTENT:
                await dc.beginDialog(GREETING_DIALOG);
                break;
              case ADD_TO_SEARCH_INTENT:
                await dc.beginDialog(RECIPE_SEARCH_DIALOG);
                break;
              case REMOVE_FROM_SEARCH_INTENT:
                await dc.beginDialog(RECIPE_SEARCH_DIALOG);
                break;
              // case SET_NAME:
              //   await  dc.context.sendActivity(`we just updated your name`);
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
     * Look at the LUIS results and determine if we need to handle
     * an interruptions due to a Help or Cancel intent
     *
     * @param {DialogContext} dc - dialog context
     * @param {LuisResults} luisResults - LUIS recognizer results
     */
  async isTurnInterrupted(dc, luisResults) {
    const topIntent = LuisRecognizer.topIntent(luisResults);

    // see if there are anh conversation interrupts we need to handle
    if (topIntent === CANCEL_INTENT) {
      if (dc.activeDialog) {
        // cancel all active dialog (clean the stack)
        await dc.cancelAllDialogs();
        await dc.context.sendActivity(`Ok.  I've cancelled our last activity.`);
      } else {
        await dc.context.sendActivity(`I don't have anything to cancel.`);
      }
      return true; // this is an interruption
    }

    if (topIntent === HELP_INTENT) {
      await dc.context.sendActivity(`Let me try to provide some help.`);
      dc.beginDialog(HELP_DIALOG);
      return true; // this is an interruption
    }
    return false; // this is not an interruption
  }
  /**
     * Helper function to update user profile with entities returned by LUIS.
     *
     * @param {LuisResults} luisResults - LUIS recognizer results
     * @param {DialogContext} dc - dialog context
     */
  async updateSearch(luisResult, context) {
    // Do we have any entities?
    const userProfile = this.userProfileAccessor.get(context);
    if (userProfile !== undefined) {

      // get userProfile object using the accessor
      userProfile.search = luisResult.entities.search
      console.log(userProfile)
      if (userProfile === undefined) {
        userProfile = new UserProfile();
      }
      // see if we have any user name entities
      // if (luisResult.entities.personName !== undefined) {
      //   userProfile.name = luisResult.entities.personName[0]
      // }
      // set the new values
      await this.userProfileAccessor.set(context, userProfile);
    }
  }
}

module.exports.MyBot = MyBot;