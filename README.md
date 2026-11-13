# Physics Principles

A website that explains the physics principles a student should know before college. Each lesson is one wide card: explanatory text on the left third, an interactive lab on the right two thirds. On screens 11" and larger the page itself never scrolls; only the text column does.

## Lessons so far

1. Newton's laws of motion
2. Kinematics
3. Conservation of energy

## Structure

```
site/
  index.html            list of all lessons
  css/site.css          shared layout and styles
  js/lab.js             shared helpers for the labs (canvas, arrows, controls)
  js/newton.js          lab for lesson 01
  js/kinematics.js      lab for lesson 02
  js/energy.js          lab for lesson 03
  lessons/*.html        one page per lesson
```

Plain HTML, CSS and JavaScript; there is no build step. To preview locally:

```
python3 -m http.server --directory site 8000
```

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`, which publishes the `site/` folder to GitHub Pages.
