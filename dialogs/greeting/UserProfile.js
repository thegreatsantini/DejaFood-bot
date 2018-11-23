class UserProfile {
    constructor(name=undefined,search, recipes=[]) {
        this.name = name;
        this.search=search;
        this.recipes = recipes;
    }
};

exports.UserProfile = UserProfile;