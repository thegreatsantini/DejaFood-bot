class User {
    constructor(name, password, savedRecipes=undefined) {
        this.name = name,
        this.password=password,
        this.savedRecipes = savedRecipes
    }
}

module.exports = User