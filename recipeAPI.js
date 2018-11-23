require('dotenv').config();
const axios = require('axios');
const { RecipeCard } = require('./dialogs/RecipeCard')


const FOOD2FORK_KEY = process.env.FOOD2FORK_API_KEY


const searchRecipes = async (query) => {
    const cleaned = query.split(' ').join(',');
    let cards = [];

    return axios.get(`http://food2fork.com/api/search?key=${FOOD2FORK_KEY}&q=${cleaned}`).then((res) => {
        const { recipes } = res.data
        for (let i = 0; i < 3; i++) {
            const item = new RecipeCard(recipes[i].image_url, recipes[i].title, recipes[i].source_url)
            cards.push(item);
        }
        return cards;
    }).catch(error => "oops something went wrong with the search");
}

module.exports.searchRecipes = searchRecipes