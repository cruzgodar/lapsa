# Lapsa: Easy, Elegant Slides

Lapsa is the incredibly simple way to build beautiful and interactive presentations. It uses HTML, CSS, and JavaScript for its layout and functionality, meaning easy things are easy and nearly anything is possible. For a quick overview of Lapsa's features, [have a look at the example project][1]. This document covers installing Lapsa, its features and details, and customization in much more depth.



## Installation and Setup

Add `lapsa.min.js` and `lapsa.min.css` to your project's folder and include them in the html. To use the built-in shelf feature, you'll also need to either add the `icons` folder and its contents or supply your own icons.

The minimal compatible html file has the following form:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<link rel="stylesheet" type="text/css" href="lapsa.min.css">
	</head>

	<body>
		<div id="lapsa-slide-container">
			<div class="slide">
				...
			</div>
			
			<div class="slide">
				...
			</div>
			
			...
		</div>
		
		<script src="lapsa.min.js"></script>
		
		<script src="index.js"></script>
	</body>
</html>
```

Create a JavaScript file and add it to the html. In the above example, it's called `index.js` and is located in the same directory as the html file. The minimal contents of that JS file are:

```js
const options =
{
	shelfIconPaths:
	[
		"/path/to/up-2.png",
		"/path/to/up-1.png",
		"/path/to/table.png",
		"/path/to/down-1.png",
		"/path/to/down-2.png"
	]
};

const lapsa = new Lapsa(options);
```

Replace each of the five paths with the appropriate paths to the icons. To use Lapsa with its standard functionality, there's no need to ever write any more code.



## HTML

Slides are contained in `<div class="slide"></div>`. The standard tags to use in slides are the typical `<h1>`, `<h2>`, and `<p>` for headings, subheadings, and body text. These all have bottom padding to separate them from one another -- to apply this padding to other elements, give them the class `.lapsa-bottom-padding`. Other helpful classes are `.lapsa-center-content`, which centers the contents of a container, and `.lapsa-align-bottom`, which positions an element absolutely in the bottom-left of the slide and is useful for footer text.

Lapsa has many features relating to **builds**, which are ways that slides can change while they're on screen. The simplest kind are HTML builds, which build just by animating in. To make an element build in, give it the `.build` class. This makes elements appear one after another -- the first element is build 0, the next is build 1, and so on. To override this behavior and specify a specific build number for an element, set the `data-build` attribute. For example, `<p data-build="2">` will always appear on the third build.



## Options

To change Lapsa's behavior, add entries to the `options` object. A complete list of the options is as follows:

**Features**

- `builds`: an object specifying slides' functional builds. See the next section for more details.
- `appendHTML`: a snippet of HTML to append to every slide, typically used for easier theming. Default: `""`.
- `useShelf`: boolean for whether to enable the shelf. If set to `false`, you will need to provide ways to call the navigation functions yourself. Default: `true`.
- `permanentShelf`: boolean for whether to make the shelf always visible. If set to `true`, the shelf will always exist in the lower-left corner of the window. Default: `false`.
- `shelfIconPaths`: 5-element array of paths to the shelf icons, specified from top to bottom of the shelf. Default: `["/icons/up-2.png", "/icons/up-1.png", "/icons/table.png", "/icons/down-1.png", "/icons/down-2.png"]`.
- `resizeOnTableView`: iOS Safari and some other broswers have chrome that very frequently resizes (e.g. when scrolling). On the slide view, Lapsa accounts for all resizes and updates the slide size immediately. On the table view, which is meant to be scrolled, this kind of constant resizing can be quite jarring, and so by default, Lapsa will wait to return to the slide view before reacting to a resize event. If set to `true`, that behavior will be overridden, and all resizes will take effect immediately. Default: `false`.
- `windowHeightAnimationFrames`: when the window is resized on the table view and a slide has been selected, Lapsa will briefly animate the window height to the new value to avoid the appearance of the slide snapping to a new position. This setting specifies the number of frames that animation should take. Set to 1 to disable the animation completely. Default: 8.

**Animations**

- `transitionAnimationTime`: animation duration in ms for slides and builds. Set to 0 to skip those animations. Default: 150.
- `transitionAnimationDistanceFactor`: by default, slides and builds animate by fading in and sliding up. Like every other part of the slides, the distance they move with scales with the size of the window -- this is the scale factor. Set to 0 to make slide and build animations animate only by fading in and out.
- `tableViewAnimationTime`: animation duration in ms to enter and exit the table view. Set to 0 to skip those animations. Default: 600.
- `shelfAnimationTime`: animation duration in ms to show and hide the shelf. Set to 0 to skip those animations. Default: 275.

**Easings**

- `slideAnimateInEasing`: easing to animate in slides and builds. Default: `"cubic-bezier(.4, 1.0, .7, 1.0)"`.
- `slideAnimateOutEasing`: easing to animate out slides and builds. Default: `"cubic-bezier(.1, 0.0, .2, 0.0)"`.
- `shelfAnimateInEasing`: easing to animate in the shelf. Default: `"cubic-bezier(.4, 1.0, .7, 1.0)"`.
- `shelfAnimateOutEasing`: easing to animate out the shelf. Default: `"cubic-bezier(.4, 0.0, .4, 1.0)"`.
- `tableViewEasing`: easing to animate in and out of the table view. Default: `"cubic-bezier(.25, 1.0, .5, 1.0)"`.
 



[1]: https://cruzgodar.com/