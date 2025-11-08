```
[Requesting] Received request for path: /UserAuthentication/authenticate
Requesting.request {
  username: 'olivia',
  password: 'olivia',
  path: '/UserAuthentication/authenticate'
} => { request: '019a61a8-ec70-7a6a-8633-1f3c074504f6' }
UserAuthentication.authenticate { username: 'olivia', password: 'olivia' } => { user: '019a618c-ac9a-7650-9764-d18b2f7692c6' }
Sessioning.create { user: '019a618c-ac9a-7650-9764-d18b2f7692c6' } => { session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb' }
Requesting.respond {
  request: '019a61a8-ec70-7a6a-8633-1f3c074504f6',
  session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb',
  user: '019a618c-ac9a-7650-9764-d18b2f7692c6'
} => { request: '019a61a8-ec70-7a6a-8633-1f3c074504f6' }
[Requesting] Received request for path: /Sessioning/_getUser
Requesting.request {
  session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb',
  path: '/Sessioning/_getUser'
} => { request: '019a61a9-56b3-78ca-918d-5be94dea3205' }
Requesting.respond {
  request: '019a61a9-56b3-78ca-918d-5be94dea3205',
  user: '019a618c-ac9a-7650-9764-d18b2f7692c6'
} => { request: '019a61a9-56b3-78ca-918d-5be94dea3205' }
[Requesting] Received request for path: /Sessioning/_getUser
Requesting.request {
  session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb',
  path: '/Sessioning/_getUser'
} => { request: '019a61a9-b1aa-7d09-980e-5413588d1f51' }
Requesting.respond {
  request: '019a61a9-b1aa-7d09-980e-5413588d1f51',
  user: '019a618c-ac9a-7650-9764-d18b2f7692c6'
} => { request: '019a61a9-b1aa-7d09-980e-5413588d1f51' }
[Requesting] Received request for path: /recommendation
Requesting.request {
  restaurant: 'McDonalds',
  user: '019a618c-ac9a-7650-9764-d18b2f7692c6',
  path: '/recommendation'
} => { request: '019a61a9-b627-7a6c-98ff-e1a8cd2797cd' }
RestaurantMenu.getRecommendation {
  restaurant: 'McDonalds',
  userLikedDishes: Frames(1) [ '019a21d0-81b2-7a91-b8ad-735cbf9e075e' ],
  userDislikedDishes: Frames(1) [ 'Italian B.M.T.' ],
  request: '019a61a9-b627-7a6c-98ff-e1a8cd2797cd'
} => { recommendation: 'Quarter Pounder with Cheese' }
Requesting.respond {
  request: '019a61a9-b627-7a6c-98ff-e1a8cd2797cd',
  recommendation: 'Quarter Pounder with Cheese'
} => { request: '019a61a9-b627-7a6c-98ff-e1a8cd2797cd' }
[Requesting] Received request for path: /Feedback/submitFeedback
Requesting.request {
  session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb',
  item: 'Quarter Pounder with Cheese',
  rating: 0,
  path: '/Feedback/submitFeedback'
} => { request: '019a61a9-f006-7645-a84f-c060c4037d62' }
Feedback.submitFeedback {
  author: '019a618c-ac9a-7650-9764-d18b2f7692c6',
  item: 'Quarter Pounder with Cheese',
  rating: 0
} => { feedback: '019a61a9-f0ce-72e0-baa7-11a052229f87' }
Requesting.respond {
  request: '019a61a9-f006-7645-a84f-c060c4037d62',
  feedback: '019a61a9-f0ce-72e0-baa7-11a052229f87'
} => { request: '019a61a9-f006-7645-a84f-c060c4037d62' }
[Requesting] Received request for path: /UserTastePreferences/addDislikedDish
Requesting.request {
  session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb',
  dish: 'Quarter Pounder with Cheese',
  path: '/UserTastePreferences/addDislikedDish'
} => { request: '019a61a9-f819-7a0c-9350-0f3d75b52b6d' }
UserTastePreferences.addDislikedDish {
  user: '019a618c-ac9a-7650-9764-d18b2f7692c6',
  dish: 'Quarter Pounder with Cheese'
} => {}
Requesting.respond {
  request: '019a61a9-f819-7a0c-9350-0f3d75b52b6d',
  message: 'Dish disliked successfully.'
} => { request: '019a61a9-f819-7a0c-9350-0f3d75b52b6d' }
[Requesting] Received request for path: /Sessioning/_getUser
Requesting.request {
  session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb',
  path: '/Sessioning/_getUser'
} => { request: '019a61aa-05c3-7353-a63b-a36fd5111242' }
Requesting.respond {
  request: '019a61aa-05c3-7353-a63b-a36fd5111242',
  user: '019a618c-ac9a-7650-9764-d18b2f7692c6'
} => { request: '019a61aa-05c3-7353-a63b-a36fd5111242' }
[Requesting] Received request for path: /Sessioning/_getUser
Requesting.request {
  session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb',
  path: '/Sessioning/_getUser'
} => { request: '019a61aa-279a-755b-b009-3006ee43e5d2' }
Requesting.respond {
  request: '019a61aa-279a-755b-b009-3006ee43e5d2',
  user: '019a618c-ac9a-7650-9764-d18b2f7692c6'
} => { request: '019a61aa-279a-755b-b009-3006ee43e5d2' }
[Requesting] Received request for path: /logout
Requesting.request { session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb', path: '/logout' } => { request: '019a61aa-2e48-798b-8134-482bd59613bb' }
Sessioning.delete { session: '019a61a8-ecf1-787b-8e2b-4fa33eff67bb' } => {}
Requesting.respond {
  request: '019a61aa-2e48-798b-8134-482bd59613bb',
  status: 'logged_out'
} => { request: '019a61aa-2e48-798b-8134-482bd59613bb' }
```