// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// greeting.js defines the greeting dialog

// Import required Bot Builder
require('dotenv').config()
// const request = require('request')
const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
// const { CardFactory } = require('botbuilder')
// User state for greeting dialog
const { UserProfile } = require('../UserProfile');
// const { RecipeCard } = require('../RecipeCard')
// const { searchRecipes } = require('../../recipeAPI')
// Minimum length requirements for city and name
const NAME_LENGTH_MIN = 3;

// Dialog IDs
const PROFILE_DIALOG = 'profileDialog';

// Prompt IDs
const NAME_PROMPT = 'namePrompt';
const SEARCH_PROMPT = 'searchPrompt';


const VALIDATION_SUCCEEDED = true;
const VALIDATION_FAILED = !VALIDATION_SUCCEEDED;

/**
 * Demonstrates the following concepts:
 *  Use a subclass of ComponentDialog to implement a multi-turn conversation
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *
 * @param {String} dialogId unique identifier for this dialog instance
 * @param {PropertyStateAccessor} userProfileAccessor property accessor for user state
 */
class Greeting extends ComponentDialog {
    constructor(dialogId, userProfileAccessor) {
        super(dialogId);

        // validate what was passed in
        if (!dialogId) throw new Error('Missing parameter.  dialogId is required');
        if (!userProfileAccessor) throw new Error('Missing parameter.  userProfileAccessor is required');

        // Add a water fall dialog with 4 steps.
        // The order of step function registration is importent
        // as a water fall dialog executes steps registered in order
        this.addDialog(new WaterfallDialog(PROFILE_DIALOG, [
            this.initializeStateStep.bind(this),
            this.promptForNameStep.bind(this),
            this.promptForRecipeSearchStep.bind(this),
            this.searchRecipeStep.bind(this)
        ]));

        // Add text prompts for name and ingredients
        this.addDialog(new TextPrompt(NAME_PROMPT, this.validateName));
        this.addDialog(new TextPrompt(SEARCH_PROMPT));
        
        // Save off our state accessor for later use
        this.userProfileAccessor = userProfileAccessor;
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Initialize our state.  See if the WaterfallDialog has state pass to it
     * If not, then just new up an empty UserProfile object
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async initializeStateStep(step) {
        console.log('BEGIN WATERFALL')
        let userProfile = await this.userProfileAccessor.get(step.context);
        if (userProfile === undefined) {
            if (step.options && step.options.userProfile) {
                await this.userProfileAccessor.set(step.context, step.options.userProfile);
            } else {
                await this.userProfileAccessor.set(step.context, new UserProfile());
            }
        }
        return await step.next();
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for their name.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async promptForNameStep(step) {
        const userProfile = await this.userProfileAccessor.get(step.context);
        // if we have everything we need, greet user and return
        if (userProfile !== undefined && userProfile.name !== undefined) {
            return await this.greetUser(step);
        }
        if (!userProfile.name) {
            // prompt for name, if missing
            return await step.prompt(NAME_PROMPT, 'What is your name?');
        } else {
            return await step.next();
        }
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for the city in which they live.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async promptForRecipeSearchStep(step) {
        // get current user
        const userProfile = await this.userProfileAccessor.get(step.context);

        // if the user gave their name
        if (userProfile.name === undefined && step.result) {
            let lowerCaseName = step.result;
            // capitalize and set name
            userProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
            await this.userProfileAccessor.set(step.context, userProfile);
        }
        // if there is a name 
        if (userProfile.name) {
            // return await step.prompt(SEARCH_PROMPT,`Hello ${userProfile.name}, You are now ready to search for recipes`);
            await step.context.sendActivity(`Hello ${userProfile.name}, You are now ready to search for recipes`)
            return await this.greetUser(step)
        } else {
            return await step.next();
        }
    }
    /**
     * Waterfall Dialog step functions.
     *
     * Using a text prompt, prompt the user for the city in which they live.
     * Only prompt if we don't have this information already.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async searchRecipeStep(step) {
        // will implement search functionality in the future
        console.log(step.result)
        return await this.greetUser(step)
    }

    /**
     * Validator function to verify that user name meets required constraints.
     *
     * @param {PromptValidatorContext} validation context for this validator.
     */
    async validateName(validatorContext) {
        // Validate that the user entered a minimum length for their name
        const value = (validatorContext.recognized.value || '').trim();
        if (value.length >= NAME_LENGTH_MIN) {
            return VALIDATION_SUCCEEDED;
        } else {
            await validatorContext.context.sendActivity(`Names need to be at least ${NAME_LENGTH_MIN} characters long.`);
            return VALIDATION_FAILED;
        }
    }
    /**
     * Helper function to greet user with information in greetingState.
     *
     * @param {WaterfallStepContext} step contextual information for the current step being executed
     */
    async greetUser(step) {
        // Display to the user their profile information and end dialog
        const userProfile = await this.userProfileAccessor.get(step.context);
        await step.context.sendActivity(`Hi ${userProfile.name}, this is from greeting`);
        await step.context.sendActivity(`You can always say 'My name is <your name> to reintroduce yourself to me.`);
        return await step.endDialog();
    }
}

exports.GreetingDialog = Greeting;