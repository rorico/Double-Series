# Double Series
An online version of the board game [Double Series](http://www.pagat.com/misc/jack.html), where you can play against your friends, or against AI.

Hosted online [here](http://game.rorico.ca/).

Created using node.js

### localhost
You can host the game locally (localhost:8081) by running `node server.js`.
You can also run AI vs AI by running `node simulation.js`. The settings for this simulation change be changed by changing the file.

### Specific rules
2 full decks, including jokers (108 total cards)
All cards shown in 10x10 grid except jacks.
Each player starts with 7 cards.
Each turn a player can play 1 card and place a token in one of the locations on the board that matches the card. (jacks are special)
Next player is the one counter clockwise of the last player.
Upon making a line of 5 in a row in any direction, the line is finished, and cannot be changed.
If a team makes 2 lines of 5, they win the game.
If no cards are left, the game ends as a tie.
Jacks are special cards, 4 of which can add a token anywhere, 4 can remove any enemy tokens.


#### Clarifications
##### I can't play this card anywhere, what do I do?
You can draw another card. This can be done on your turn at any point. You can still play another card on that turn.

##### Can I remove another teams' line of 5 with a minus J?
No, after it is finished, it cannot be changed.

##### My line of 5 goes through another line of 5. Does it count?
No. Even if it is on your team, after a line of 5 is finished, it cannot be used again.

##### I finished 2 lines of 5 with a single token. Does this count?
Yes it does! These are incredibly rare; it is known as a Double Series!

##### Can I remove my own team's token with a minus J?
No.


#### Card Differences
##### Jacks
Normally, the correspond to 1 eyed jacks and 2 eyed jacks in a standard deck are remove and add, respectively. These have been changed for clarity.

##### Jokers
These are denoted by stars.


Moved here from [Side-Projects](https://github.com/rorico/side-projects) repo, under `Double Series/online` 
Previous changes can be found ther.
