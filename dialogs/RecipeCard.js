
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
						},
						{
							"type": "ColumnSet",
							"columns": [
								{
									"type": "Column",
									"width": "stretch",
									"items": [
										{
											"type": "TextBlock",
											"spacing": "none",
											"text": `${this.sourceUrl}`,
											"isSubtle": true,
											"wrap": true
										}
									]
								}
							]
						}
					]
				}
			],
			"actions": [
				{
					"type": "Action.OpenUrl",
					"title": "View Recipe",
					"url": "${cardUrl}"
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