// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, CardFactory } = require('botbuilder');

//dialog cards
const IntroCard = require('./resources/IntroCard.json')
// Turn counter property
const TURN_COUNTER_PROPERTY = 'turnCounterProperty';
const WELCOMED_USER = 'welcomedUserProperty';
const USER_PROFILE = 'user'

class MyBot {
  /**
   *
   * @param {ConversationState} conversation state object
   */
  constructor(conversationState, userState) {
    // Creates a new state accessor property.
    // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
    this.countProperty = conversationState.createProperty(TURN_COUNTER_PROPERTY);
    this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);
    this.conversationState = conversationState;
    this.userState = userState;
    // this.userProfile = this.userState.createProperty(USER_PROFILE)
  }
  /**
   *
   * @param {TurnContext} on turn context object.
   */
  async onTurn(turnContext) {
    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    if (turnContext.activity.type === ActivityTypes.Message) {

      // Read UserState. If the 'DidBotWelcomedUser' does not exist (first time ever for a user)
      // set the default to false.

      const didBotWelcomedUser = await this.welcomedUserProperty.get(turnContext, false);
      if (didBotWelcomedUser === false) {
        // The channel should send the user name in the 'From' object
        let userName = turnContext.activity.from.name;
        await turnContext.sendActivity('You are seeing this message because this was your first message ever sent to this bot.');
        await turnContext.sendActivity(`It is a good practice to welcome the user and provide personal greeting. For example, welcome ${userName}.`);

        // Set the flag indicating the bot handled the user's first message.
        await this.welcomedUserProperty.set(turnContext, true);
      }
      let count = await this.countProperty.get(turnContext);
      count = count === undefined ? 1 : ++count;
      await turnContext.sendActivity(`${count}: I said "${turnContext.activity.text}"`);
      // increment and set turn counter.
      await this.countProperty.set(turnContext, count);
    } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
      // Send greeting when users are added to the conversation.
      await this.sendWelcomeMessage(turnContext);
    } else {
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
            text: 'Intro Adaptive Card',
            attachments: [CardFactory.adaptiveCard(IntroCard)]
          });
        }
      }
    }
  }
}

module.exports.MyBot = MyBot;