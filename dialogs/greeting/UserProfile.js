class UserProfile {
    constructor(name=undefined, recipes=[]) {
        this.name = name;
        this.recipes = recipes;
    }
};

exports.UserProfile = UserProfile;