# Design Document

The overall design of this project ended up being pretty different from the original specs I outlined back in Assignment 2. At that point, I had three syncs - RestaurantMenu, UserTastePreferences, and Recommend. My original plan was to have a very general “Recommend” concept that could take in a set of options and apply a selection policy to determine the final choice. However, once I started actually implementing the system, I realized that the process of generating a recommendation worked best as a sync rather than as its own concept. Once I started connecting different parts of the app, I noticed that it depended too heavily on other components, so it should just be a sync.

My final design included five concepts - RestaurantMenu, UserTastePreferences, UserAuthentication, Sessioning, and Feedback. These additional concepts came as I built out the app and recognized new needs, like storing user information, maintaining active sessions, and collecting feedback from users about their recommended items. Each new concept made the system more complete. By the end, I felt like all my concepts came together like how a real-world app would actually behave.


_Here are the concepts, taken from Context_

- [Original Concepts](context/design/brainstorming/allconcepts.md/20251016_235456.b7021c70.md) 

- [New Concepts](design/brainstorming/concept_def.md)

The new concepts I added make the app more modular and complete. They do not rely on the implementation of other concepts to work and they encapsulate everything necessary for the app to work. 

Visually, not much changed from Assignment 4b to Assignment 4c. I had the core logic of my app already built out and didn’t make any major changes to the functionality, so there was no need to really change much in the front-end. I cleaned up some of the visual elements as I created syncs for them (login, recommendation page, updating ratings, etc.), but overall there weren’t many changes. I did have to modify the logic of login and recommend, since they weren’t true syncs in previous assignments, but overall it stayed pretty consistent. 
