class UserProfile {
    constructor(name=undefined,search=undefined, recipes=[]) {
        this.name = name;
        this.search=search;
        this.recipes = recipes;
    }
};

exports.UserProfile = UserProfile;