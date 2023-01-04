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
	shelfIconPaths: ["/path/to/up-2.png", "/path/to/up-1.png", "/path/to/table.png", "/path/to/down-1.png", "/path/to/down-2.png"]
};

const lapsa = new Lapsa(options);
```

Replace each of the five paths with the appropriate paths to the icons. To use Lapsa with its standard functionality, there's no need to ever write any more code.



## HTML

Slides are contained in `<div class="slide"></div>`. The standard tags to use in slides are the typical `<h1>`, `<h2>`, and `<p>` for headings, subheadings, and body text. These all have bottom padding to separate them from one another -- to apply this padding to other elements, give them the class `.lapsa-bottom-padding`. Other helpful classes are `.lapsa-center-content`, which centers the contents of a container, and `.lapsa-align-bottom`, which positions an element absolutely in the bottom-left of the slide and is useful for footer text.

Lapsa has many features relating to **builds**, which are ways that slides can change while they're on screen. The simplest kind are HTML builds, which build just by animating in. To make an element build in, give it the `.build` class. This makes elements appear one after another -- the first element is build 0, the next is build 1, and so on. To override this behavior and specify a specific build number for an element, set the `data-build` attribute. For example, `<p data-build="2">` will always appear on the third build.



[1]: https://cruzgodar.com/