
class RecipeCard {
	constructor(imgUrl, title, url) {
		this.imgUrl = imgUrl;
		this.title = title;
		this.url = url;
	}

	renderCard() {
		return ({
			"$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
			"type": "AdaptiveCard",
			"version": "1.0",
			"body": [
				{
					"type": "Container",
					"items": [
						{
							"type": "Image",
							"url": `${this.imgUrl}`,
							"size": "stretch"
						},
						{
							"type": "TextBlock",
							"text": `${this.title}`,
							"weight": "bolder",
							"size": "medium"
						}
					]
				}
			],
			"actions": [
				{
					"type": "Action.OpenUrl",
					"title": "View Recipe",
					"url": `${this.url}`
				},
				{
					"type": "Action.OpenUrl",
					"title": "Save Recipe",
					"url": "http://adaptivecards.io"
				}
			]
		}
		)
	}
}

exports.RecipeCard = RecipeCard;