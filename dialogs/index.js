// see https://aka.ms/about-bot-activity-message to learn more about the message and other activity types
if (turnContext.activity.type === 'message') {
    // read from state and set default object if object does not exist in storage.
    let topicState = await this.topicState.get(turnContext, {
        //Define the topic state object
        prompt: "askName"
    });
    let userProfile = await this.userProfile.get(turnContext, {
        // Define the user's profile object
        "userName": "",
        "telephoneNumber": ""
    });

    if (topicState.prompt == "askName") {
        await turnContext.sendActivity("What is your name?");

        // Set next prompt state
        topicState.prompt = "askNumber";

        // Update state
        await this.topicState.set(turnContext, topicState);
    }
    else if (topicState.prompt == "askNumber") {
        // Set the UserName that is defined in the UserProfile class
        userProfile.userName = turnContext.activity.text;

        // Use the user name to prompt the user for phone number
        await turnContext.sendActivity(`Hello, ${userProfile.userName}. What's your telephone number?`);

        // Set next prompt state
        topicState.prompt = "confirmation";

        // Update states
        await this.topicState.set(turnContext, topicState);
        await this.userProfile.set(turnContext, userProfile);
    }
    else if (topicState.prompt == "confirmation") {
        // Set the phone number
        userProfile.telephoneNumber = turnContext.activity.text;

        // Sent confirmation
        await turnContext.sendActivity(`Got it, ${userProfile.userName}. I'll call you later.`)

        // reset initial prompt state
        topicState.prompt = "askName"; // Reset for a new conversation

        // Update states
        await this.topicState.set(turnContext, topicState);
        await this.userProfile.set(turnContext, userProfile);
    }

    // Save state changes to storage
    await this.conversationState.saveChanges(turnContext);
    await this.userState.saveChanges(turnContext);

}
else {
    await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
}