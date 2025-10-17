# Concept Design Changes as a Whole

Throughout this entire process, I realized I had an incomplete understanding of some of the concept design principles. I was able to refine them more while actually implementing them, which helped solidify my understanding of the concepts. I also learned how to make the concepts more robust, but still independent. The main changes that I made was to create a UserAuthentication and Feedback concept. These will be essential as I build out the rest of the app and allow for a smoother user experience.


Some of my interesting moments included

- Creating the test files
  - Making the test files helped me figure out what each concept was actually supposed to do. While writing them, I noticed some parts of my original design didn’t fully make sense, so I ended up adjusting a few things to make everything line up better.
- Dealing with TypeScript type errors
  - I ran into a bunch of TypeScript type errors that took longer to fix than I expected. It was frustrating at first, but it helped me understand how the data was moving between different parts of my code and made the overall design more solid.
- Learning how to use the Context tool while brainstorming
  - At first, I wasn’t totally sure how to use the Context tool, but playing around with it helped me see how it connects different parts of the project. It ended up being really helpful for keeping track of my design ideas and changes over time.
- Seeing the different outputs when changing the prompt or context. For example, when given the rubric, Context told me one of my concepts should be a sync, but without it, it said it should be its own concept. 
  - It was interesting to see how much the LLM’s response could change depending on what context I gave it. For example, when I included the rubric, it said one of my concepts should be a sync, but without the rubric, it said it should be its own concept. That showed me how sensitive it is to small changes in the prompt.
- Producing code with errors and trying to get Context to fix it
  - Some of the code Context generated looked good at first but had small bugs that only showed up when I tried to run it. Trying to get Context to fix those bugs was a good learning moment since I started to see what kinds of mistakes the LLM tends to make and how to write better prompts to avoid them.